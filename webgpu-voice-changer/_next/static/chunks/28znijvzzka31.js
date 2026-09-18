(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,60079,52073,e=>{"use strict";e.s(["F0_MAX",0,900,"F0_MIN",0,55,"FFT_SIZE",0,2048,"FRAME_INFO_FLOATS",0,4,"HALF_BINS",0,1025,"HOP_SIZE",0,512,"LIVE_MAX_FRAMES",0,8,"OFFLINE_MAX_FRAMES",0,64,"PV_STATE_FLOATS",0,2054],60079);let t=20/Math.LN10;function a(e,t){if(0===e.length)return 0;let a=(e.length-1)*t,r=Math.floor(a),i=Math.min(r+1,e.length-1);return e[r]+(e[i]-e[r])*(a-r)}function r(e,t,a){let r=e/2048,i=Math.max(1,Math.round(t/r));return[i,Math.max(i+1,Math.min(1024,Math.round(a/r)))]}function i(e,t){let[a,i]=r(t,100,Math.min(8e3,t/2-100)),s=0;for(let t=a;t<=i;t++)s+=e[t];let n=s/(i-a+1),o=new Float32Array(e.length);for(let t=0;t<e.length;t++)o[t]=e[t]-n;return o}let s=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];e.s(["LN_TO_DB",0,t,"bandBins",0,r,"computeVoiceFeatures",0,function(e,s,n,o){let l=new Float32Array(n),u=new Float32Array(n),f=[];for(let t=0;t<n;t++){let a=e[4*t+1],r=20*Math.log10(Math.max(a,1e-6));u[t]=r,a>1e-5&&f.push(r)}f.sort((e,t)=>e-t);let p=a(f,.95)-30,h=[],c=[];for(let t=0;t<n;t++){let a=e[4*t],r=e[4*t+2],i=a>0&&r>.6&&u[t]>p;l[t]=i?a:0,i&&(h.push(t),c.push(a))}let m=h;if(m.length<5){m=[];for(let e=0;e<n;e++)u[e]>p&&m.push(e)}let g=new Float32Array(1025);if(m.length>0){for(let e of m){let t=1025*e;for(let e=0;e<1025;e++)g[e]+=s[t+e]}for(let e=0;e<1025;e++)g[e]/=m.length}let d=i(g,o),F=c.slice().sort((e,t)=>e-t);return{sampleRate:o,frameCount:n,voicedFrames:h.length,durationSec:512*n/o,medianF0:a(F,.5),f0Low:a(F,.1),f0High:a(F,.9),shape:d,brightnessDb:function(e,a){let[i,s]=r(a,200,1e3),[n,o]=r(a,2e3,Math.min(6e3,a/2-100)),l=0;for(let t=i;t<=s;t++)l+=e[t];l/=s-i+1;let u=0;for(let t=n;t<=o;t++)u+=e[t];return((u/=o-n+1)-l)*t}(d,o),f0Track:l,rmsTrackDb:u}},"hzToNoteName",0,function(e){if(!(e>0))return"--";let t=Math.round(69+12*Math.log2(e/440)),a=s[(t%12+12)%12],r=Math.floor(t/12)-1;return`${a}${r}`},"normalizeShape",0,i,"resampleShape",0,function(e,t,a){if(t===a)return e;let r=new Float32Array(1025),s=a/t;for(let t=0;t<1025;t++){let a=Math.min(t*s,1024),i=Math.floor(a),n=Math.min(i+1,1024);r[t]=e[i]+(e[n]-e[i])*(a-i)}return i(r,a)}],52073)},75624,e=>{"use strict";var t=e.i(60079),a=e.i(52073);let r=`
const N: u32 = 2048u;
const LOGN: u32 = 11u;
const HALF: u32 = 1025u;
const WG: u32 = 256u;
const PI: f32 = 3.14159265358979;
const TWO_PI: f32 = 6.28318530717959;
const LOG10_E: f32 = 0.43429448190325;

var<workgroup> re: array<f32, 2048>;
var<workgroup> im: array<f32, 2048>;

fn bitrev(x: u32) -> u32 {
  return reverseBits(x) >> (32u - LOGN);
}

fn hann(n: u32) -> f32 {
  return 0.5 - 0.5 * cos(TWO_PI * f32(n) / f32(N));
}
`,i=`
@group(0) @binding(0) var<storage, read> twiddles: array<vec2<f32>>;

// In-place iterative radix-2 DIT FFT over the workgroup arrays. Input must be
// stored in bit-reversed order; output is in natural order. The inverse
// transform conjugates the twiddles and scales by 1/N.
fn fft_inplace(lid: u32, inverse: bool) {
  var len = 2u;
  loop {
    if (len > N) { break; }
    let halfLen = len >> 1u;
    let tstep = N / len;
    for (var b = lid; b < N / 2u; b += WG) {
      let group = b / halfLen;
      let pos = b - group * halfLen;
      let i0 = group * len + pos;
      let i1 = i0 + halfLen;
      let tw = twiddles[pos * tstep];
      let wr = tw.x;
      var wi = tw.y;
      if (inverse) { wi = -wi; }
      let xr = re[i1];
      let xi = im[i1];
      let tr = xr * wr - xi * wi;
      let ti = xr * wi + xi * wr;
      let ur = re[i0];
      let ui = im[i0];
      re[i0] = ur + tr;
      im[i0] = ui + ti;
      re[i1] = ur - tr;
      im[i1] = ui - ti;
    }
    workgroupBarrier();
    len = len << 1u;
  }
  if (inverse) {
    let s = 1.0 / f32(N);
    for (var i = lid; i < N; i += WG) {
      re[i] = re[i] * s;
      im[i] = im[i] * s;
    }
    workgroupBarrier();
  }
}
`,s=`
${r}
${i}

struct AnalyzeParams {
  frameCount: u32,
  sampleRate: f32,
  f0Min: f32,
  f0Max: f32,
}

@group(0) @binding(1) var<uniform> params: AnalyzeParams;
@group(0) @binding(2) var<storage, read> frames: array<f32>;
@group(0) @binding(3) var<storage, read_write> mag: array<f32>;
@group(0) @binding(4) var<storage, read_write> phase: array<f32>;
@group(0) @binding(5) var<storage, read_write> env: array<f32>;
@group(0) @binding(6) var<storage, read_write> frameInfo: array<vec4<f32>>;

// Pitch tracking works on a 2x decimated copy of the raw frame (M samples at
// fs/2) using the normalised cross-correlation function (NCCF, as in RAPT):
// exact linear correlation with per-lag energy normalisation, so there is no
// window bias and no circular wrap-around to create spurious sub-harmonics.
const M: u32 = 1024u;
const MAX_LAGS_PER_THREAD: u32 = 4u;

@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) wid: vec3<u32>, @builtin(local_invocation_id) lidv: vec3<u32>) {
  let f = wid.x;
  let lid = lidv.x;
  let base = f * HALF;

  // --- 1. windowed frame -> spectrum -------------------------------------
  for (var n = lid; n < N; n += WG) {
    let r = bitrev(n);
    re[r] = frames[f * N + n] * hann(n);
    im[r] = 0.0;
  }
  workgroupBarrier();
  fft_inplace(lid, false);

  for (var k = lid; k < HALF; k += WG) {
    let a = re[k];
    let b = im[k];
    mag[base + k] = sqrt(a * a + b * b);
    phase[base + k] = atan2(b, a);
  }
  // DC estimate from the windowed sum (sum of the Hann window is N/2).
  let dc = re[0] / f32(N / 2u);
  workgroupBarrier();

  // --- 2. decimated, DC-free copy of the raw frame + energy ----------------
  var energy = 0.0;
  for (var m = lid; m < M; m += WG) {
    let a = frames[f * N + 2u * m] - dc;
    let b = frames[f * N + 2u * m + 1u] - dc;
    re[m] = 0.5 * (a + b);
    energy += a * a + b * b;
  }
  workgroupBarrier();

  // --- 3. NCCF over the candidate lag range --------------------------------
  let fsD = params.sampleRate * 0.5;
  let lagMin = max(u32(fsD / params.f0Max), 4u);
  let lagMax = min(u32(fsD / params.f0Min), M / 2u - 2u);
  var rr: array<f32, MAX_LAGS_PER_THREAD>;
  for (var i = 0u; i < MAX_LAGS_PER_THREAD; i++) {
    let t = lagMin + lid + i * WG;
    var r = -1.0;
    if (t <= lagMax) {
      var cross = 0.0;
      var e1 = 0.0;
      var e2 = 0.0;
      let count = M - t;
      for (var n = 0u; n < count; n++) {
        let a = re[n];
        let b = re[n + t];
        cross += a * b;
        e1 += a * a;
        e2 += b * b;
      }
      r = cross / sqrt(e1 * e2 + 1e-12);
    }
    rr[i] = r;
  }
  workgroupBarrier();
  for (var i = 0u; i < MAX_LAGS_PER_THREAD; i++) {
    let t = lagMin + lid + i * WG;
    if (t <= lagMax) { im[t] = rr[i]; }
  }
  im[M + lid] = energy;
  workgroupBarrier();

  // --- 4. peak picking (single thread, ~400 lags) --------------------------
  if (lid == 0u) {
    var bestStrength = -10.0;
    var bestLag = 0u;
    var bestVal = 0.0;
    var prev = -1.0;
    var cur = im[lagMin];
    for (var t = lagMin; t <= lagMax; t++) {
      var next = -1.0;
      if (t < lagMax) { next = im[t + 1u]; }
      if (cur > prev && cur >= next && cur > 0.3) {
        // Preference for shorter lags (higher pitch) breaks the tie between a
        // period and its multiples, suppressing octave-down errors.
        let strength = cur - 0.05 * log2(f32(t) * params.f0Min / fsD);
        if (strength > bestStrength) {
          bestStrength = strength;
          bestLag = t;
          bestVal = cur;
        }
      }
      prev = cur;
      cur = next;
    }
    var f0 = 0.0;
    var clarity = 0.0;
    if (bestLag > 0u) {
      var ym = bestVal;
      var yp = bestVal;
      if (bestLag > lagMin) { ym = im[bestLag - 1u]; }
      if (bestLag < lagMax) { yp = im[bestLag + 1u]; }
      let denom = ym - 2.0 * bestVal + yp;
      var delta = 0.0;
      if (abs(denom) > 1e-9) { delta = clamp(0.5 * (ym - yp) / denom, -1.0, 1.0); }
      let lag = f32(bestLag) + delta;
      clarity = clamp(bestVal, 0.0, 1.0);
      if (clarity > 0.5) { f0 = fsD / lag; }
    }
    var total = 0.0;
    for (var i = 0u; i < WG; i++) { total += im[M + i]; }
    let rms = sqrt(total / f32(N));
    // Cepstral lifter length: below the pitch period so harmonics are smoothed
    // out but formants are kept.
    let fs = params.sampleRate;
    var lifter = fs / 400.0;
    if (f0 > 0.0) { lifter = clamp(0.7 * fs / f0, 32.0, 512.0); }
    frameInfo[f] = vec4<f32>(f0, rms, clarity, lifter);
  }
  storageBarrier();
  workgroupBarrier();
  let lifterLen = frameInfo[f].w;

  // --- 5. spectral envelope by cepstral smoothing of log|X| --------------
  for (var k = lid; k < N; k += WG) {
    var kk = k;
    if (k > N / 2u) { kk = N - k; }
    let r = bitrev(k);
    re[r] = log(max(mag[base + kk], 1e-7));
    im[r] = 0.0;
  }
  workgroupBarrier();
  fft_inplace(lid, false);

  for (var q = lid; q < N; q += WG) {
    let d = f32(min(q, N - q));
    var w = 0.0;
    let t = d / lifterLen;
    if (t <= 0.7) { w = 1.0; }
    else if (t < 1.0) { w = 0.5 + 0.5 * cos(PI * (t - 0.7) / 0.3); }
    im[q] = re[q] * w;
  }
  workgroupBarrier();
  for (var q = lid; q < N; q += WG) { re[bitrev(q)] = im[q]; }
  workgroupBarrier();
  for (var q = lid; q < N; q += WG) { im[q] = 0.0; }
  workgroupBarrier();
  fft_inplace(lid, true);

  for (var k = lid; k < HALF; k += WG) {
    env[base + k] = re[k];
  }
}
`,n=`
${r}

struct TransformParams {
  frameCount: u32,
  hop: u32,
  pitchRatio: f32,
  formantRatio: f32,
  timbreStrength: f32,
  intonation: f32,
  styleF0: f32,
  userF0: f32,
  sampleRate: f32,
  gateDb: f32,
  outputGain: f32,
  gateDepth: f32,
  hasStyleShape: u32,
  hasUserShape: u32,
  breath: f32,
  _pad: u32,
}

@group(0) @binding(1) var<uniform> params: TransformParams;
@group(0) @binding(2) var<storage, read> mag: array<f32>;
@group(0) @binding(3) var<storage, read> phase: array<f32>;
@group(0) @binding(4) var<storage, read> env: array<f32>;
@group(0) @binding(5) var<storage, read> frameInfo: array<vec4<f32>>;
@group(0) @binding(6) var<storage, read> styleShape: array<f32>;
@group(0) @binding(7) var<storage, read> userShape: array<f32>;
@group(0) @binding(8) var<storage, read_write> pvState: array<f32>;
@group(0) @binding(9) var<storage, read_write> outSpec: array<vec2<f32>>;

const BINS_PER_THREAD: u32 = 5u;
const PEAK_SPLIT: u32 = 1023u;

// Shared-memory layout (16 KiB total, see PRELUDE_COMMON):
//   re[0 .. HALF)          instantaneous frequency of each source bin (in bins)
//   re[HALF .. 2048)       peak index of source bins 0 .. 1022
//   im[0 .. HALF)          accumulated phase correction per output bin (psi)
//   im[HALF .. HALF + 2)   peak index of source bins 1023 .. 1024
fn ld_peak(j: u32) -> u32 {
  if (j < PEAK_SPLIT) { return u32(re[HALF + j]); }
  return u32(im[HALF + (j - PEAK_SPLIT)]);
}
fn st_peak(j: u32, p: u32) {
  if (j < PEAK_SPLIT) { re[HALF + j] = f32(p); } else { im[HALF + (j - PEAK_SPLIT)] = f32(p); }
}

fn sample_env(base: u32, pos: f32) -> f32 {
  let p = clamp(pos, 0.0, f32(HALF - 1u));
  let i0 = u32(floor(p));
  let i1 = min(i0 + 1u, HALF - 1u);
  return mix(env[base + i0], env[base + i1], p - f32(i0));
}

fn sample_user_shape(pos: f32) -> f32 {
  let p = clamp(pos, 0.0, f32(HALF - 1u));
  let i0 = u32(floor(p));
  let i1 = min(i0 + 1u, HALF - 1u);
  return mix(userShape[i0], userShape[i1], p - f32(i0));
}

fn wrap_pi(x: f32) -> f32 {
  return x - TWO_PI * round(x / TWO_PI);
}

// Climb the magnitude spectrum to the local maximum that "owns" bin j
// (its region of influence, Laroche & Dolson identity phase locking).
fn find_peak(base: u32, j: u32) -> u32 {
  var p = j;
  for (var s = 0u; s < 6u; s++) {
    let m = mag[base + p];
    var up = -1.0;
    var dn = -1.0;
    if (p + 1u < HALF) { up = mag[base + p + 1u]; }
    if (p > 0u) { dn = mag[base + p - 1u]; }
    if (up > m && up >= dn) { p = p + 1u; }
    else if (dn > m) { p = p - 1u; }
    else { break; }
  }
  return p;
}

// Bin-scaling a spectrum also scales the analysis window in time by 1/ratio.
// This returns the mean of (time-scaled Hann) * (synthesis Hann) over a frame,
// which is 3/8 for ratio 1; together with a sqrt(ratio) term it keeps the
// overlap-add level constant regardless of the pitch ratio.
fn ola_energy(ratio: f32) -> f32 {
  var acc = 0.0;
  for (var i = 0u; i < 64u; i++) {
    let t = (f32(i) + 0.5) / 64.0;
    let u = ratio * (t - 0.5) + 0.5;
    var wr = 0.0;
    if (u > 0.0 && u < 1.0) {
      let su = sin(PI * u);
      wr = su * su;
    }
    let st = sin(PI * t);
    acc += wr * st * st;
  }
  return max(acc / 64.0, 0.05);
}

fn hash(x: u32) -> f32 {
  var h = x * 747796405u + 2891336453u;
  h = ((h >> ((h >> 28u) + 4u)) ^ h) * 277803737u;
  h = (h >> 22u) ^ h;
  return f32(h) / 4294967295.0;
}

@compute @workgroup_size(256)
fn main(@builtin(local_invocation_id) lidv: vec3<u32>) {
  let lid = lidv.x;
  let expct = TWO_PI * f32(params.hop) / f32(N);
  let binHz = params.sampleRate / f32(N);

  var lastPh: array<f32, BINS_PER_THREAD>;
  var psiLocal: array<f32, BINS_PER_THREAD>;
  for (var i = 0u; i < BINS_PER_THREAD; i++) {
    let k = lid + i * WG;
    if (k < HALF) {
      lastPh[i] = pvState[k];
      im[k] = pvState[HALF + k];
    }
  }
  var lastRatio = pvState[2u * HALF];
  var frameSeed = u32(pvState[2u * HALF + 1u]);
  var initialised = pvState[2u * HALF + 2u] > 0.5;
  if (lastRatio <= 0.0) { lastRatio = params.pitchRatio; }
  workgroupBarrier();

  for (var f = 0u; f < params.frameCount; f++) {
    let base = f * HALF;
    let info = frameInfo[f];
    let f0 = info.x;

    // Pitch ratio for this frame. pitchRatio already equals
    // styleF0 / userF0 * manual offset; intonation != 1 rescales how far the
    // speaker's own pitch excursions are carried into the target voice.
    var targetRatio = params.pitchRatio;
    if (f0 > 0.0 && params.styleF0 > 0.0 && params.userF0 > 0.0) {
      targetRatio = params.pitchRatio * pow(f0 / params.userF0, params.intonation - 1.0);
    }
    targetRatio = clamp(targetRatio, 0.25, 4.0);
    var alpha = 0.35;
    if (f0 <= 0.0) { alpha = 0.1; }
    let ratio = mix(lastRatio, targetRatio, alpha);
    lastRatio = ratio;

    let rmsDb = 20.0 * log(max(info.y, 1e-6)) * LOG10_E;
    let gate = smoothstep(params.gateDb - 6.0, params.gateDb + 6.0, rmsDb);
    let gain = params.outputGain * mix(params.gateDepth, 1.0, gate);
    frameSeed = frameSeed + 1u;

    // (a) per source bin: instantaneous frequency (in bins) and owning peak.
    for (var i = 0u; i < BINS_PER_THREAD; i++) {
      let j = lid + i * WG;
      if (j < HALF) {
        let ph = phase[base + j];
        var d = ph - lastPh[i];
        lastPh[i] = ph;
        d = wrap_pi(d - f32(j) * expct);
        re[j] = f32(j) + d / expct;
        st_peak(j, find_peak(base, j));
      }
    }
    workgroupBarrier();

    // (b) per output bin: phase correction. Every bin inherits the accumulated
    //     correction of its peak's output bin and adds the peak's extra phase
    //     advance due to frequency scaling, so a whole harmonic lobe moves as a
    //     unit (identity phase locking). On the first frame after a reset the
    //     previous phases are unknown, so no correction is accumulated.
    for (var i = 0u; i < BINS_PER_THREAD; i++) {
      let k = lid + i * WG;
      if (k < HALF) {
        let p = f32(k) / ratio;
        var psi = 0.0;
        if (p < f32(HALF - 1u)) {
          let j0 = u32(floor(p));
          var jn = j0;
          if (p - f32(j0) > 0.5) { jn = j0 + 1u; }
          let jp = ld_peak(jn);
          let kp = min(u32(round(f32(jp) * ratio)), HALF - 1u);
          var inc = re[jp] * (ratio - 1.0) * expct;
          if (!initialised) { inc = 0.0; }
          psi = wrap_pi(im[kp] + inc);
        }
        psiLocal[i] = psi;
      }
    }
    workgroupBarrier();
    for (var i = 0u; i < BINS_PER_THREAD; i++) {
      let k = lid + i * WG;
      if (k < HALF) { im[k] = psiLocal[i]; }
    }

    // (c) per output bin: gather the shifted harmonic fine structure, impose the
    //     target envelope and synthesise. The +/- PI parity term re-references
    //     the window to zero phase so a stretched lobe stays coherent.
    var eIn = 0.0;
    var eOut = 0.0;
    for (var i = 0u; i < BINS_PER_THREAD; i++) {
      let k = lid + i * WG;
      if (k < HALF) {
        var out = vec2<f32>(0.0, 0.0);
        let p = f32(k) / ratio;
        let mk = mag[base + k];
        eIn += mk * mk;
        if (k > 0u && k < HALF - 1u && p < f32(HALF - 1u)) {
          let j0 = u32(floor(p));
          let fr = p - f32(j0);
          var jn = j0;
          if (fr > 0.5) { jn = j0 + 1u; }
          let fine0 = mag[base + j0] * exp(-env[base + j0]);
          let fine1 = mag[base + j0 + 1u] * exp(-env[base + j0 + 1u]);
          var fine = mix(fine0, fine1, fr);

          let kw = f32(k) / params.formantRatio;
          var envT = sample_env(base, kw);
          if (params.hasStyleShape == 1u) {
            var user = 0.0;
            if (params.hasUserShape == 1u) { user = sample_user_shape(kw); }
            envT = envT + params.timbreStrength * (styleShape[k] - user);
          }

          if (params.breath > 0.0) {
            // Breathiness: blend in a noisy replica of the fine structure so
            // the upper band sounds airy rather than purely harmonic.
            let hz = f32(k) * binHz;
            let air = smoothstep(1500.0, 5000.0, hz) * params.breath;
            let noise = hash(k * 2654435761u + frameSeed * 40503u) * 2.0 - 1.0;
            fine = fine * (1.0 + air * noise * 1.5);
          }

          let lowcut = smoothstep(50.0, 90.0, f32(k) * binHz);
          let outMag = fine * exp(envT) * lowcut;
          eOut += outMag * outMag;
          var flip = 0.0;
          if (((k + jn) & 1u) == 1u) { flip = PI; }
          let phOut = phase[base + jn] + flip + psiLocal[i];
          out = vec2<f32>(outMag * cos(phOut), outMag * sin(phOut));
        }
        outSpec[base + k] = out;
      }
    }
    workgroupBarrier();

    // (d) match the frame energy to the input so that pitch ratio and timbre
    //     transfer do not change loudness, then apply gate / output gain.
    //     re[] is free at this point; im[] still holds psi.
    re[lid] = eIn;
    re[WG + lid] = eOut;
    workgroupBarrier();
    if (lid == 0u) {
      var sIn = 0.0;
      var sOut = 0.0;
      for (var i = 0u; i < WG; i++) {
        sIn += re[i];
        sOut += re[WG + i];
      }
      var scale = 1.0;
      if (sOut > 1e-12) { scale = clamp(sqrt(sIn / sOut), 0.25, 4.0); }
      re[0] = scale;
    }
    workgroupBarrier();
    // sqrt(ratio): the energy match above sets the frame energy, but the
    // time-scaled window spreads that energy over 1/ratio of the frame.
    let frameGain = re[0] * gain * (0.375 / (ola_energy(ratio) * sqrt(ratio)));
    for (var i = 0u; i < BINS_PER_THREAD; i++) {
      let k = lid + i * WG;
      if (k < HALF) { outSpec[base + k] = outSpec[base + k] * frameGain; }
    }
    initialised = true;
    workgroupBarrier();
  }

  for (var i = 0u; i < BINS_PER_THREAD; i++) {
    let k = lid + i * WG;
    if (k < HALF) {
      pvState[k] = lastPh[i];
      pvState[HALF + k] = im[k];
    }
  }
  if (lid == 0u) {
    pvState[2u * HALF] = lastRatio;
    pvState[2u * HALF + 1u] = f32(frameSeed % 1048576u);
    pvState[2u * HALF + 2u] = 1.0;
  }
}
`,o=`
${r}
${i}

@group(0) @binding(1) var<storage, read> outSpec: array<vec2<f32>>;
@group(0) @binding(2) var<storage, read_write> outFrames: array<f32>;

@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) wid: vec3<u32>, @builtin(local_invocation_id) lidv: vec3<u32>) {
  let f = wid.x;
  let lid = lidv.x;
  let base = f * HALF;

  for (var k = lid; k < N; k += WG) {
    var v: vec2<f32>;
    if (k <= N / 2u) {
      v = outSpec[base + k];
    } else {
      let c = outSpec[base + (N - k)];
      v = vec2<f32>(c.x, -c.y);
    }
    let r = bitrev(k);
    re[r] = v.x;
    im[r] = v.y;
  }
  workgroupBarrier();
  fft_inplace(lid, true);

  // Hann synthesis window; with 75% overlap the analysis*synthesis windows sum
  // to 1.5, hence the 2/3 normalisation.
  for (var n = lid; n < N; n += WG) {
    outFrames[f * N + n] = re[n] * hann(n) * (2.0 / 3.0);
  }
}
`;async function l(e,t,a){let r=e.createShaderModule({code:t,label:a}),i=(await r.getCompilationInfo()).messages.filter(e=>"error"===e.type);if(i.length>0){let e=i.map(e=>`  line ${e.lineNum}:${e.linePos} ${e.message}`).join("\n");throw Error(`WGSL 編譯失敗 (${a}):
${e}`)}return r}class u{device;info;analyzePipeline;transformPipeline;synthesizePipeline;twiddles;constructor(e,t,a,r,i,s){this.device=e,this.info=t,this.analyzePipeline=a,this.transformPipeline=r,this.synthesizePipeline=i,this.twiddles=s}static isSupported(){return"u">typeof navigator&&!!navigator.gpu}static async create(){if(!u.isSupported())throw Error("此瀏覽器不支援 WebGPU。請使用 Chrome / Edge 113+ 或其他支援 WebGPU 的瀏覽器。");let e=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!e)throw Error("找不到可用的 WebGPU 適配器（GPU 可能被停用或不支援）。");let a=await e.requestDevice({label:"voice-changer"}),r=e.info,i={vendor:r?.vendor??"",architecture:r?.architecture??"",device:r?.device??"",description:r?.description??"",isFallbackAdapter:!!(r?.isFallbackAdapter??e.isFallbackAdapter)},[f,p,h]=await Promise.all([l(a,s,"analyze"),l(a,n,"transform"),l(a,o,"synthesize")]),[c,m,g]=await Promise.all([a.createComputePipelineAsync({label:"analyze",layout:"auto",compute:{module:f,entryPoint:"main"}}),a.createComputePipelineAsync({label:"transform",layout:"auto",compute:{module:p,entryPoint:"main"}}),a.createComputePipelineAsync({label:"synthesize",layout:"auto",compute:{module:h,entryPoint:"main"}})]),d=new Float32Array(t.FFT_SIZE);for(let e=0;e<t.FFT_SIZE/2;e++){let a=2*Math.PI*e/t.FFT_SIZE;d[2*e]=Math.cos(a),d[2*e+1]=-Math.sin(a)}let F=a.createBuffer({label:"twiddles",size:d.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});return a.queue.writeBuffer(F,0,d),new u(a,i,c,m,g,F)}}class f{ctx;maxFrames;device;frames;analyzeParams;mag;phase;env;frameInfo;transformParams;styleShape;userShape;pvState;outSpec;outFrames;staging;analyzeBindGroup;transformBindGroup;synthesizeBindGroup;infoOffset;envOffset;analyzeParamsData;transformParamsData;lock;hasStyleShape;hasUserShape;destroyed;constructor(e,a){this.ctx=e,this.maxFrames=a,this.analyzeParamsData=new ArrayBuffer(16),this.transformParamsData=new ArrayBuffer(64),this.lock=Promise.resolve(),this.hasStyleShape=!1,this.hasUserShape=!1,this.destroyed=!1;const r=e.device;this.device=r;const i=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,s=a*t.FFT_SIZE*4,n=a*t.HALF_BINS*4,o=a*t.FRAME_INFO_FLOATS*4;this.frames=r.createBuffer({label:"frames",size:s,usage:i}),this.analyzeParams=r.createBuffer({label:"analyzeParams",size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.mag=r.createBuffer({label:"mag",size:n,usage:i}),this.phase=r.createBuffer({label:"phase",size:n,usage:i}),this.env=r.createBuffer({label:"env",size:n,usage:i|GPUBufferUsage.COPY_SRC}),this.frameInfo=r.createBuffer({label:"frameInfo",size:o,usage:i|GPUBufferUsage.COPY_SRC}),this.transformParams=r.createBuffer({label:"transformParams",size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.styleShape=r.createBuffer({label:"styleShape",size:4*t.HALF_BINS,usage:i}),this.userShape=r.createBuffer({label:"userShape",size:4*t.HALF_BINS,usage:i}),this.pvState=r.createBuffer({label:"pvState",size:4*t.PV_STATE_FLOATS,usage:i}),this.outSpec=r.createBuffer({label:"outSpec",size:a*t.HALF_BINS*8,usage:i}),this.outFrames=r.createBuffer({label:"outFrames",size:s,usage:i|GPUBufferUsage.COPY_SRC}),this.infoOffset=s,this.envOffset=s+o,this.staging=r.createBuffer({label:"staging",size:s+o+n,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.analyzeBindGroup=r.createBindGroup({label:"analyze",layout:e.analyzePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e.twiddles}},{binding:1,resource:{buffer:this.analyzeParams}},{binding:2,resource:{buffer:this.frames}},{binding:3,resource:{buffer:this.mag}},{binding:4,resource:{buffer:this.phase}},{binding:5,resource:{buffer:this.env}},{binding:6,resource:{buffer:this.frameInfo}}]}),this.transformBindGroup=r.createBindGroup({label:"transform",layout:e.transformPipeline.getBindGroupLayout(0),entries:[{binding:1,resource:{buffer:this.transformParams}},{binding:2,resource:{buffer:this.mag}},{binding:3,resource:{buffer:this.phase}},{binding:4,resource:{buffer:this.env}},{binding:5,resource:{buffer:this.frameInfo}},{binding:6,resource:{buffer:this.styleShape}},{binding:7,resource:{buffer:this.userShape}},{binding:8,resource:{buffer:this.pvState}},{binding:9,resource:{buffer:this.outSpec}}]}),this.synthesizeBindGroup=r.createBindGroup({label:"synthesize",layout:e.synthesizePipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:e.twiddles}},{binding:1,resource:{buffer:this.outSpec}},{binding:2,resource:{buffer:this.outFrames}}]}),this.resetState()}resetState(){this.device.queue.writeBuffer(this.pvState,0,new Float32Array(t.PV_STATE_FLOATS))}setStyleShape(e){this.hasStyleShape=!!e&&e.length===t.HALF_BINS,e&&this.hasStyleShape&&this.device.queue.writeBuffer(this.styleShape,0,e)}setUserShape(e){this.hasUserShape=!!e&&e.length===t.HALF_BINS,e&&this.hasUserShape&&this.device.queue.writeBuffer(this.userShape,0,e)}writeAnalyzeParams(e,a){let r=new Uint32Array(this.analyzeParamsData),i=new Float32Array(this.analyzeParamsData);r[0]=e,i[1]=a,i[2]=t.F0_MIN,i[3]=t.F0_MAX,this.device.queue.writeBuffer(this.analyzeParams,0,this.analyzeParamsData)}writeTransformParams(e,a,r){let i=new Uint32Array(this.transformParamsData),s=new Float32Array(this.transformParamsData);i[0]=e,i[1]=t.HOP_SIZE,s[2]=r.pitchRatio,s[3]=r.formantRatio,s[4]=r.timbreStrength,s[5]=r.intonation,s[6]=r.styleF0,s[7]=r.userF0,s[8]=a,s[9]=r.gateDb,s[10]=r.outputGain,s[11]=r.gateDepth,i[12]=+!!this.hasStyleShape,i[13]=+!!this.hasUserShape,s[14]=r.breath,i[15]=0,this.device.queue.writeBuffer(this.transformParams,0,this.transformParamsData)}run(e){let t=this.lock.then(e,e);return this.lock=t.catch(()=>void 0),t}analyze(e,a,r){return this.run(async()=>{this.assertUsable(a,e),this.device.queue.writeBuffer(this.frames,0,e,0,a*t.FFT_SIZE),this.writeAnalyzeParams(a,r);let i=this.device.createCommandEncoder(),s=i.beginComputePass();s.setPipeline(this.ctx.analyzePipeline),s.setBindGroup(0,this.analyzeBindGroup),s.dispatchWorkgroups(a),s.end(),i.copyBufferToBuffer(this.frameInfo,0,this.staging,this.infoOffset,a*t.FRAME_INFO_FLOATS*4),i.copyBufferToBuffer(this.env,0,this.staging,this.envOffset,a*t.HALF_BINS*4),this.device.queue.submit([i.finish()]);let n=this.envOffset+a*t.HALF_BINS*4;await this.staging.mapAsync(GPUMapMode.READ,0,n);let o=new Float32Array(this.staging.getMappedRange(this.infoOffset,a*t.FRAME_INFO_FLOATS*4).slice(0)),l=new Float32Array(this.staging.getMappedRange(this.envOffset,a*t.HALF_BINS*4).slice(0));return this.staging.unmap(),{count:a,info:o,env:l}})}process(e,a,r,i){return this.run(async()=>{this.assertUsable(a,e),this.device.queue.writeBuffer(this.frames,0,e,0,a*t.FFT_SIZE),this.writeAnalyzeParams(a,r),this.writeTransformParams(a,r,i);let s=this.device.createCommandEncoder(),n=s.beginComputePass();n.setPipeline(this.ctx.analyzePipeline),n.setBindGroup(0,this.analyzeBindGroup),n.dispatchWorkgroups(a),n.setPipeline(this.ctx.transformPipeline),n.setBindGroup(0,this.transformBindGroup),n.dispatchWorkgroups(1),n.setPipeline(this.ctx.synthesizePipeline),n.setBindGroup(0,this.synthesizeBindGroup),n.dispatchWorkgroups(a),n.end(),s.copyBufferToBuffer(this.outFrames,0,this.staging,0,a*t.FFT_SIZE*4),s.copyBufferToBuffer(this.frameInfo,0,this.staging,this.infoOffset,a*t.FRAME_INFO_FLOATS*4),s.copyBufferToBuffer(this.env,0,this.staging,this.envOffset,a*t.HALF_BINS*4),this.device.queue.submit([s.finish()]);let o=this.envOffset+a*t.HALF_BINS*4;await this.staging.mapAsync(GPUMapMode.READ,0,o);let l=new Float32Array(this.staging.getMappedRange(0,a*t.FFT_SIZE*4).slice(0)),u=new Float32Array(this.staging.getMappedRange(this.infoOffset,a*t.FRAME_INFO_FLOATS*4).slice(0)),f=new Float32Array(this.staging.getMappedRange(this.envOffset,a*t.HALF_BINS*4).slice(0));return this.staging.unmap(),{count:a,out:l,info:u,env:f}})}assertUsable(e,a){if(this.destroyed)throw Error("VoicePipeline 已被釋放");if(e<1||e>this.maxFrames)throw Error(`frame count ${e} 超出範圍 (1..${this.maxFrames})`);if(a.length<e*t.FFT_SIZE)throw Error("frames 緩衝區長度不足")}destroy(){for(let e of(this.destroyed=!0,[this.frames,this.analyzeParams,this.mag,this.phase,this.env,this.frameInfo,this.transformParams,this.styleShape,this.userShape,this.pvState,this.outSpec,this.outFrames,this.staging]))e.destroy()}}var p=e.i(14098);class h{pipeline;sampleRate;history;ola;constructor(e,a){this.pipeline=e,this.sampleRate=a,this.history=new Float32Array(t.FFT_SIZE),this.ola=new Float32Array(t.FFT_SIZE)}reset(){this.history.fill(0),this.ola.fill(0),this.pipeline.resetState()}get maxBlocks(){return this.pipeline.maxFrames}async process(e,a){let r=e.length;if(0===r)return{outputs:[],info:new Float32Array(0),env:new Float32Array(0)};if(r>this.pipeline.maxFrames)throw Error("too many blocks for one dispatch");let i=new Float32Array(r*t.FFT_SIZE);for(let a=0;a<r;a++){this.history.copyWithin(0,t.HOP_SIZE);let r=e[a];r.length===t.HOP_SIZE?this.history.set(r,t.FFT_SIZE-t.HOP_SIZE):(this.history.fill(0,t.FFT_SIZE-t.HOP_SIZE),this.history.set(r.subarray(0,t.HOP_SIZE),t.FFT_SIZE-t.HOP_SIZE)),i.set(this.history,a*t.FFT_SIZE)}let s=await this.pipeline.process(i,r,this.sampleRate,a),n=[],o=this.ola;for(let e=0;e<r;e++){let a=e*t.FFT_SIZE;for(let e=0;e<t.FFT_SIZE;e++)o[e]+=s.out[a+e];n.push(o.slice(0,t.HOP_SIZE)),o.copyWithin(0,t.HOP_SIZE),o.fill(0,t.FFT_SIZE-t.HOP_SIZE)}return{outputs:n,info:s.info,env:s.env}}}let c=self;function m(e,t){c.postMessage(e,t)}function g(e){return e instanceof Error?e.message:String(e)}let d=(e,t,a)=>Math.min(a,Math.max(t,e)),F=null,b=null,v=null,y=p.DEFAULT_CONTROLS,S=null,_=null,A=null,w=null,P=48e3,k=[],E=!1,I=null,B=0,M=0,L=new Float32Array(t.HALF_BINS),R=0,T=0,O=0,H={gpuMs:0,blocksPerDispatch:0,queueDepth:0,inputF0:0,inputRmsDb:-100,liveMedianF0:0,targetF0:0,processedBlocks:0,droppedBlocks:0,adaptiveShapeFrames:0};function G(){if(!F)throw Error("GPU 尚未初始化");return v||(v=new f(F,t.OFFLINE_MAX_FRAMES)),v}function N(e,t,a=!0){let r,i;if(e.bypass)return{pitchRatio:1,formantRatio:1,timbreStrength:0,intonation:1,styleF0:0,userF0:t,gateDb:-200,gateDepth:1,outputGain:e.outputGain,breath:0};let s=Math.pow(2,e.pitchOffsetSemitones/12);if("semitones"===e.pitch.mode){let a=Math.pow(2,e.pitch.semitones/12);r=t*a*s,i=a*s}else r=e.pitch.hz*s,i=e.pitch.hz/t*s;return{pitchRatio:d(i,.25,4),formantRatio:d(e.formantRatio,.5,2),timbreStrength:a?d(e.timbreStrength,0,1.5):0,intonation:d(e.intonation,0,2),styleF0:r,userF0:t,gateDb:e.gateDb,gateDepth:d(e.gateDepth,0,1),outputGain:d(e.outputGain,0,4),breath:d(e.breath,0,1)}}function x(e,t,r){e.setStyleShape(S?(0,a.resampleShape)(S.shape,S.sampleRate,t):null),S?.relative?e.setUserShape(null):void 0!==r?e.setUserShape(r):_?e.setUserShape((0,a.resampleShape)(_.shape,_.sampleRate,t)):R>=20?e.setUserShape(L):e.setUserShape(null)}function D(e=!1){let t=performance.now();(e||!(t-O<150))&&(O=t,H.queueDepth=k.length,m({type:"stats",stats:{...H}}))}function z(e){let a=e.data,r=null;if(a instanceof ArrayBuffer?r=new Float32Array(a):a instanceof Float32Array&&(r=a),!r)return;k.push(r);let i=2*t.LIVE_MAX_FRAMES;if(k.length>i){let e=k.length-t.LIVE_MAX_FRAMES;k.splice(0,e),H.droppedBlocks+=e}U()}async function U(){if(!E&&w){E=!0;try{for(;k.length>0&&w&&A;){let e=k.splice(0,w.maxBlocks),r=performance.now(),i=N(y,y.userF0>0?y.userF0:M>=8?Math.pow(2,B):150,!S||!!S.relative||!!_||R>=20),s=await w.process(e,i),n=performance.now()-r;if(H.gpuMs=H.gpuMs>0?.9*H.gpuMs+.1*n:n,H.blocksPerDispatch=e.length,!A)break;for(let e of s.outputs)I&&I.push(e.slice()),A.postMessage(e,[e.buffer]);H.processedBlocks+=e.length,function(e,r,i,s){let[n,o]=(0,a.bandBins)(P,100,Math.min(8e3,P/2-100));for(let a=0;a<i;a++){let i=e[a*t.FRAME_INFO_FLOATS],s=e[a*t.FRAME_INFO_FLOATS+1],l=e[a*t.FRAME_INFO_FLOATS+2],u=20*Math.log10(Math.max(s,1e-6));H.inputRmsDb=u;let f=i>0&&l>.6&&u>y.gateDb+6&&u>-55;if(H.inputF0=f?i:0,!f)continue;let p=Math.log2(i),h=Math.max(.02,1/(M+1));B=0===M?p:B+(p-B)*h,M++;let c=a*t.HALF_BINS,m=0;for(let e=n;e<=o;e++)m+=r[c+e];m/=o-n+1;let g=Math.max(.01,1/(R+1));for(let e=0;e<t.HALF_BINS;e++){let t=r[c+e]-m;L[e]+=(t-L[e])*g}R++,T++}H.liveMedianF0=M>=8?Math.pow(2,B):0,H.targetF0=s.styleF0,H.adaptiveShapeFrames=R,!_&&!S?.relative&&b&&R>=20&&T>=16&&(b.setUserShape(L),T=0)}(s.info,s.env,e.length,i),D()}}catch(e){m({type:"error",message:`即時處理錯誤: ${g(e)}`})}finally{E=!1}}}async function Z(e,r){let i,s=G(),n=e.length>=t.FFT_SIZE?e:((i=new Float32Array(t.FFT_SIZE)).set(e),i),o=Math.floor((n.length-t.FFT_SIZE)/t.HOP_SIZE)+1,l=new Float32Array(o*t.FRAME_INFO_FLOATS),u=new Float32Array(o*t.HALF_BINS),f=new Float32Array(t.OFFLINE_MAX_FRAMES*t.FFT_SIZE);for(let e=0;e<o;e+=t.OFFLINE_MAX_FRAMES){let a=Math.min(t.OFFLINE_MAX_FRAMES,o-e);for(let r=0;r<a;r++){let a=(e+r)*t.HOP_SIZE;f.set(n.subarray(a,a+t.FFT_SIZE),r*t.FFT_SIZE)}let i=await s.analyze(f,a,r);l.set(i.info,e*t.FRAME_INFO_FLOATS),u.set(i.env,e*t.HALF_BINS)}return(0,a.computeVoiceFeatures)(l,u,o,r)}async function j(e,a,r,i){let s,n=G(),o=i.userF0;if(!(o>0)||!_){let e=await Z(a,r);o>0||(o=e.medianF0>0?e.medianF0:150),_||(s=e.shape)}x(n,r,s);let l=N(i,o),u=new h(n,r);u.reset();let f=Math.ceil((a.length+t.FFT_SIZE)/t.HOP_SIZE),p=new Float32Array(f*t.HOP_SIZE);for(let r=0;r<f;r+=t.OFFLINE_MAX_FRAMES){let i=Math.min(t.OFFLINE_MAX_FRAMES,f-r),s=[];for(let e=0;e<i;e++){let i=new Float32Array(t.HOP_SIZE),n=(r+e)*t.HOP_SIZE;n<a.length&&i.set(a.subarray(n,Math.min(n+t.HOP_SIZE,a.length))),s.push(i)}(await u.process(s,l)).outputs.forEach((e,a)=>p.set(e,(r+a)*t.HOP_SIZE)),m({type:"progress",id:e,value:Math.min(1,(r+i)/f)})}let c=t.FFT_SIZE-t.HOP_SIZE;return p.slice(c,c+a.length)}async function W(e){switch(e.type){case"init":try{F=await u.create(),b=new f(F,t.LIVE_MAX_FRAMES),F.device.lost.then(e=>{m({type:"error",message:`WebGPU 裝置遺失: ${e.message}`})}),m({type:"ready",info:F.info})}catch(e){m({type:"error",message:g(e)})}return;case"connectAudio":if(!b)throw Error("GPU 尚未初始化");A?.close(),k=[],P=e.sampleRate,B=0,M=0,L.fill(0),R=0,T=0,H.processedBlocks=0,H.droppedBlocks=0,H.gpuMs=0,H.adaptiveShapeFrames=0,(w=new h(b,P)).reset(),x(b,P),(A=e.port).onmessage=z,D(!0);return;case"disconnectAudio":A?.close(),A=null,w=null,k=[],D(!0);return;case"setControls":y=e.controls;return;case"setStyleShape":S=e.payload,b&&w&&x(b,P);return;case"setUserShape":_=e.payload,b&&w&&x(b,P);return;case"analyze":try{let t=await Z(e.samples,e.sampleRate);m({type:"analyzeResult",id:e.id,features:t},[t.shape.buffer,t.f0Track.buffer,t.rmsTrackDb.buffer])}catch(t){m({type:"error",id:e.id,message:`分析失敗: ${g(t)}`})}return;case"render":try{let t=await j(e.id,e.samples,e.sampleRate,e.controls);m({type:"renderResult",id:e.id,samples:t,sampleRate:e.sampleRate},[t.buffer])}catch(t){m({type:"error",id:e.id,message:`渲染失敗: ${g(t)}`})}return;case"startRecording":I=[];return;case"stopRecording":{let t=I??[];I=null;let a=new Float32Array(t.reduce((e,t)=>e+t.length,0)),r=0;for(let e of t)a.set(e,r),r+=e.length;m({type:"recording",id:e.id,samples:a,sampleRate:P},[a.buffer]);return}case"resetState":return void w?.reset()}}c.onmessage=e=>{W(e.data).catch(e=>m({type:"error",message:g(e)}))},e.s([],75624)},14098,e=>{"use strict";e.s(["DEFAULT_CONTROLS",0,{pitch:{mode:"semitones",semitones:0},pitchOffsetSemitones:0,formantRatio:1,timbreStrength:0,intonation:1,breath:0,gateDb:-60,gateDepth:.05,outputGain:1,userF0:0,bypass:!1}])}]);