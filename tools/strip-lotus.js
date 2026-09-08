/* Build lotus.glb from the source Sketchfab export.
 *
 * The export is 19.7MB / 367k triangles for one flower, and 209k of those
 * triangles (≈14MB of raw vertex data) are a single hyper-dense centre pod
 * that sits inside the petals: removing it changes 1,122 pixels — 0.15% of
 * the canvas — even when the flower is framed tight. The banner clones this
 * model many times, so the pod is dropped here rather than at runtime.
 *
 * Nothing is quantized or re-encoded: kept geometry is copied byte for byte.
 * Dropped meshes have their accessors, bufferViews and bytes removed, and
 * every index into those arrays is remapped.
 *
 * Usage: node tools/strip-lotus.js <source.glb> <out.glb>
 */
const fs = require('fs');

const DROP_MATERIAL = 'wire_145028177.005';   // the centre pod
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node tools/strip-lotus.js <source.glb> <out.glb>'); process.exit(1); }

/* ---------- read ---------- */
const glb = fs.readFileSync(src);
if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
let at = 12, jsonChunk = null, binChunk = null;
while (at < glb.length) {
  const len = glb.readUInt32LE(at), type = glb.readUInt32LE(at + 4);
  const body = glb.slice(at + 8, at + 8 + len);
  if (type === 0x4e4f534a) jsonChunk = body;
  else if (type === 0x004e4942) binChunk = body;
  at += 8 + len + ((4 - (len % 4)) % 4);
}
const j = JSON.parse(jsonChunk.toString('utf8'));
if (!binChunk) throw new Error('expected a single-buffer GLB');
if ((j.accessors || []).some(a => a.sparse)) throw new Error('sparse accessors not handled');
if ((j.buffers || []).length !== 1) throw new Error('expected exactly one buffer');

const matName = i => ((j.materials || [])[i] || {}).name;
const origMeshCount = (j.meshes || []).length;
const origTris = (j.meshes || []).reduce((n, m) => n + m.primitives.reduce((k, p) =>
  k + (p.indices !== undefined ? j.accessors[p.indices].count / 3 : 0), 0), 0);

/* ---------- decide what stays ---------- */
const keptMeshes = [], meshMap = new Map();
(j.meshes || []).forEach((m, i) => {
  const prims = m.primitives.filter(p => matName(p.material) !== DROP_MATERIAL);
  if (!prims.length) return;                       // whole mesh was the pod
  meshMap.set(i, keptMeshes.length);
  keptMeshes.push({ ...m, primitives: prims });
});

/* accessors still reachable: kept primitives + every animation sampler */
const accUsed = new Set();
for (const m of keptMeshes) for (const p of m.primitives) {
  Object.values(p.attributes || {}).forEach(a => accUsed.add(a));
  if (p.indices !== undefined) accUsed.add(p.indices);
  (p.targets || []).forEach(t => Object.values(t).forEach(a => accUsed.add(a)));
}
for (const anim of j.animations || []) for (const s of anim.samplers) { accUsed.add(s.input); accUsed.add(s.output); }

const accMap = new Map();
const keptAccessors = [];
[...accUsed].sort((a, b) => a - b).forEach(i => { accMap.set(i, keptAccessors.length); keptAccessors.push({ ...j.accessors[i] }); });

/* How the bytes get smaller: this export packs all 290 accessors into 8 shared,
 * partly interleaved bufferViews, so dropping accessors alone frees nothing. Each
 * kept accessor is therefore re-emitted into its own tightly packed bufferView —
 * same values, element for element, just re-laid out so the dead ones are gone. */
const COMP_SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const NUM_COMP = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const ELEMENT_ARRAY = 34963, ARRAY_BUFFER = 34962;

/* what is each accessor used for? decides the bufferView target */
const asIndex = new Set(), asAttr = new Set();
for (const m of keptMeshes) for (const p of m.primitives) {
  if (p.indices !== undefined) asIndex.add(p.indices);
  Object.values(p.attributes || {}).forEach(a => asAttr.add(a));
  (p.targets || []).forEach(t => Object.values(t).forEach(a => asAttr.add(a)));
}

const keptViews = [];
const parts = [];
let offset = 0;
const pushView = (bytes, target) => {
  const pad = (4 - (offset % 4)) % 4;                          // every view 4-byte aligned
  if (pad) { parts.push(Buffer.alloc(pad)); offset += pad; }
  const idx = keptViews.length;
  keptViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, ...(target ? { target } : {}) });
  parts.push(bytes);
  offset += bytes.length;
  return idx;
};

[...accUsed].sort((a, b) => a - b).forEach(oldIdx => {
  const a = keptAccessors[accMap.get(oldIdx)];
  if (a.bufferView === undefined) return;                      // zero-filled accessor, no bytes
  const src = j.bufferViews[a.bufferView];
  const compSize = COMP_SIZE[a.componentType], numComp = NUM_COMP[a.type];
  if (!compSize || !numComp) throw new Error(`unhandled accessor type ${a.type}/${a.componentType}`);
  const elemSize = compSize * numComp;
  const isAttr = asAttr.has(oldIdx);
  if (isAttr && elemSize % 4) throw new Error(`attribute element ${elemSize}B breaks 4-byte alignment`);
  const stride = src.byteStride || elemSize;                   // de-interleave when byteStride is set
  const base = (src.byteOffset || 0) + (a.byteOffset || 0);
  const bytes = Buffer.alloc(a.count * elemSize);
  for (let i = 0; i < a.count; i++) binChunk.copy(bytes, i * elemSize, base + i * stride, base + i * stride + elemSize);
  a.bufferView = pushView(bytes, asIndex.has(oldIdx) ? ELEMENT_ARRAY : isAttr ? ARRAY_BUFFER : undefined);
  delete a.byteOffset;                                         // tightly packed now
});

/* images keep their bytes verbatim */
const imgViewMap = new Map();
(j.images || []).forEach(im => {
  if (im.bufferView === undefined) return;
  if (!imgViewMap.has(im.bufferView)) {
    const bv = j.bufferViews[im.bufferView];
    imgViewMap.set(im.bufferView, pushView(binChunk.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)));
  }
});
const bin = Buffer.concat(parts);

/* ---------- rewrite every index ---------- */
keptMeshes.forEach(m => m.primitives.forEach(p => {
  const attrs = {};
  for (const [k, v] of Object.entries(p.attributes || {})) attrs[k] = accMap.get(v);
  p.attributes = attrs;
  if (p.indices !== undefined) p.indices = accMap.get(p.indices);
  if (p.targets) p.targets = p.targets.map(t => Object.fromEntries(Object.entries(t).map(([k, v]) => [k, accMap.get(v)])));
}));
(j.nodes || []).forEach(n => {
  if (n.mesh === undefined) return;
  if (meshMap.has(n.mesh)) n.mesh = meshMap.get(n.mesh);
  else delete n.mesh;                              // node survives so its animation channels stay valid
});
(j.images || []).forEach(im => { if (im.bufferView !== undefined) im.bufferView = imgViewMap.get(im.bufferView); });
(j.animations || []).forEach(anim => anim.samplers.forEach(s => { s.input = accMap.get(s.input); s.output = accMap.get(s.output); }));

j.meshes = keptMeshes;
j.accessors = keptAccessors;
j.bufferViews = keptViews;
j.buffers = [{ byteLength: bin.length }];

/* ---------- write ---------- */
let jsonOut = Buffer.from(JSON.stringify(j), 'utf8');
if (jsonOut.length % 4) jsonOut = Buffer.concat([jsonOut, Buffer.alloc(4 - (jsonOut.length % 4), 0x20)]);
const binPad = bin.length % 4 ? Buffer.alloc(4 - (bin.length % 4)) : Buffer.alloc(0);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonOut.length + 8 + bin.length + binPad.length, 8);
const jHead = Buffer.alloc(8); jHead.writeUInt32LE(jsonOut.length, 0); jHead.writeUInt32LE(0x4e4f534a, 4);
const bHead = Buffer.alloc(8); bHead.writeUInt32LE(bin.length + binPad.length, 0); bHead.writeUInt32LE(0x004e4942, 4);
fs.writeFileSync(out, Buffer.concat([header, jHead, jsonOut, bHead, bin, binPad]));

const tris = keptMeshes.reduce((n, m) => n + m.primitives.reduce((k, p) =>
  k + (p.indices !== undefined ? keptAccessors[p.indices].count / 3 : 0), 0), 0);
console.log(`${src} ${(glb.length / 1048576).toFixed(2)}MB  →  ${out} ${(fs.statSync(out).size / 1048576).toFixed(2)}MB`);
console.log(`meshes ${j.meshes.length} (was ${origMeshCount}), triangles ${Math.round(tris)} (was ${Math.round(origTris)}), ` +
            `accessors ${keptAccessors.length}, bufferViews ${keptViews.length}`);
