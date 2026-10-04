/* Torn-paper "burn" edge between the About and Create sections: a WebGL canvas (noise edge, grain fibres, bloom).
   Constants are the instance settings of the original component: scale 2.9, noise .5, scroll .001, softness .105,
   bloom .5 / radius .15, base speed .01, colours cream + white, parallax on. */
(() => {
  const canvas = document.querySelector(".section-about-workshop-canvas");
  if (!canvas) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
  if (!gl) return;
  const GRAIN = 100.0;
  const VS = "attribute vec2 a_position;varying mediump vec2 v_uv;void main(){v_uv=0.5*(a_position+1.0);gl_Position=vec4(a_position,0.0,1.0);}";
  const HEAD = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nvarying mediump vec2 v_uv;\n";
  const SCENE = HEAD + `uniform vec3 u_color;uniform vec3 u_transition_color;uniform float u_noise_scale;uniform float u_noise_intensity;uniform float u_scroll_offset;uniform float u_edge_softness;uniform float u_grain_scale;uniform float u_movement_horizontal;uniform float u_movement_vertical;uniform float u_parallax_offset;uniform float u_aspect_ratio;
float random(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}
float noise(vec2 st){vec2 i=floor(st);vec2 f=fract(st);float a=random(i);float b=random(i+vec2(1.0,0.0));float c=random(i+vec2(0.0,1.0));float d=random(i+vec2(1.0,1.0));vec2 u=f*f*(3.0-2.0*f);return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;}
float fbm(vec2 st){float value=0.0;float amplitude=0.5;for(int i=0;i<4;i++){value+=amplitude*noise(st);st*=2.0;amplitude*=0.5;}return value;}
float detailedNoise(vec2 st){float value=0.0;float amplitude=0.5;for(int i=0;i<6;i++){value+=amplitude*noise(st);st*=2.2;amplitude*=0.45;}return value;}
void main(){
float baseLine=0.5+u_parallax_offset;
float horizontalOffset=u_scroll_offset*u_movement_horizontal;float verticalOffset=u_scroll_offset*u_movement_vertical;
vec2 noiseCoord=vec2(v_uv.x*u_aspect_ratio*u_noise_scale+horizontalOffset,v_uv.y*3.0+verticalOffset*0.6);
float edgeNoise=fbm(noiseCoord);float mainEdge=baseLine+(edgeNoise-0.5)*u_noise_intensity;
vec2 thicknessNoiseCoord=vec2(v_uv.x*u_aspect_ratio*u_noise_scale*2.3+horizontalOffset*0.7,v_uv.y*2.0+verticalOffset*0.4+100.0);
float thicknessNoise=fbm(thicknessNoiseCoord);
float minThickness=u_edge_softness*0.1;float maxThickness=u_edge_softness;float localThickness=mix(minThickness,maxThickness,thicknessNoise);
float lowerBound=mainEdge-localThickness*0.4;float upperBound=mainEdge+localThickness*0.6;
vec2 grainCoord=vec2(v_uv.x*u_aspect_ratio*u_grain_scale*3.0+horizontalOffset*0.5,v_uv.y*u_grain_scale*3.0+verticalOffset*0.3);
float grain=detailedNoise(grainCoord);
vec2 fiberCoord=vec2(v_uv.x*u_aspect_ratio*u_grain_scale*8.0+horizontalOffset*0.3,v_uv.y*u_grain_scale*2.0+verticalOffset*0.2);
float fiberNoise=noise(fiberCoord);float combinedGrain=grain*0.6+fiberNoise*0.4;
if(v_uv.y<lowerBound){gl_FragColor=vec4(u_color,1.0);}
else if(v_uv.y<mainEdge){float t=(v_uv.y-lowerBound)/max(mainEdge-lowerBound,0.001);float grainThreshold=1.0-pow(t,1.5);grainThreshold-=thicknessNoise*0.2;if(combinedGrain>grainThreshold){gl_FragColor=vec4(u_transition_color,1.0);}else{gl_FragColor=vec4(u_color,1.0);}}
else if(v_uv.y<upperBound){float t=(v_uv.y-mainEdge)/max(upperBound-mainEdge,0.001);float grainThreshold=pow(t,1.2);grainThreshold+=thicknessNoise*0.15;if(combinedGrain>grainThreshold){gl_FragColor=vec4(u_transition_color,1.0);}else{discard;}}
else{discard;}}`;
  const EXTRACT = HEAD + `uniform sampler2D u_texture;uniform vec3 u_transition_color;uniform vec3 u_base_color;
void main(){vec4 pixel=texture2D(u_texture,v_uv);float distToTransition=length(pixel.rgb-u_transition_color);float distToBase=length(pixel.rgb-u_base_color);float isTransition=1.0-smoothstep(0.0,0.5,distToTransition);float notBase=smoothstep(0.0,0.3,distToBase);float mask=isTransition*notBase*pixel.a;mask=pow(mask,0.8);gl_FragColor=vec4(1.0,1.0,1.0,mask);}`;
  const BLUR = HEAD + `uniform sampler2D u_texture;uniform vec2 u_direction;uniform vec2 u_resolution;uniform float u_radius;
void main(){float blur_size=u_radius*12.0;float alpha=0.0;float totalWeight=0.0;for(int i=-6;i<=6;i++){float offset=float(i);float weight=exp(-0.5*(offset*offset)/4.0);vec2 sampleOffset=u_direction*(offset*blur_size)/u_resolution;float sampleAlpha=texture2D(u_texture,v_uv+sampleOffset).a;alpha+=sampleAlpha*weight;totalWeight+=weight;}alpha=totalWeight>0.0?alpha/totalWeight:0.0;gl_FragColor=vec4(1.0,1.0,1.0,alpha);}`;
  const COMP = HEAD + `uniform sampler2D u_scene;uniform sampler2D u_bloom;uniform float u_bloom_intensity;uniform vec3 u_transition_color;
void main(){vec4 scene=texture2D(u_scene,v_uv);vec4 bloom=texture2D(u_bloom,v_uv);float bloomStrength=bloom.a*u_bloom_intensity;vec3 bloomColor=u_transition_color*bloomStrength*2.0;
if(scene.a<0.001){float glowAlpha=bloomStrength*1.5;gl_FragColor=vec4(u_transition_color,glowAlpha);}else{vec3 result=scene.rgb+bloomColor;result=min(result,vec3(1.0));gl_FragColor=vec4(result,scene.a);}}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : (console.error(gl.getShaderInfoLog(s)), null); };
  const prog = (fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p; };
  const P = { scene: prog(SCENE), extract: prog(EXTRACT), blur: prog(BLUR), comp: prog(COMP) };
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const target = (w, h) => {
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { fb, tex, w, h };
  };
  let W = 0, H = 0, scene, bA, bB;
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1), r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (w === W && h === H) return;
    W = w; H = h; canvas.width = w; canvas.height = h;
    scene = target(w, h); const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1); bA = target(hw, hh); bB = target(hw, hh);
  };
  const draw = (p, uniforms) => {
    gl.useProgram(p);
    const a = gl.getAttribLocation(p, "a_position"); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    let unit = 0;
    uniforms.forEach(([name, kind, v]) => {
      const loc = gl.getUniformLocation(p, name);
      if (kind === "t") { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, v); gl.uniform1i(loc, unit); unit++; }
      else if (kind === "1f") gl.uniform1f(loc, v);
      else if (kind === "2f") gl.uniform2f(loc, v[0], v[1]);
      else gl.uniform3f(loc, v[0], v[1], v[2]);
    });
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const into = (t) => { gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fb : null); gl.viewport(0, 0, t ? t.w : W, t ? t.h : H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); };
  const CREAM = [241 / 255, 238 / 255, 225 / 255], WHITE = [1, 1, 1];
  const t0 = performance.now(); let acc = 0, lastY = scrollY, visible = true, first = true;
  addEventListener("scroll", () => { acc += (scrollY - lastY) * 0.001; lastY = scrollY; }, { passive: true });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(canvas);
  new ResizeObserver(resize).observe(canvas); resize();
  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible && !first) return;
    first = false;
    const r = canvas.getBoundingClientRect(), vh = innerHeight;
    const o = Math.min(1, Math.max(0, 1 - (vh - r.top) / (vh + r.height)));
    const scroll = reduce ? 0 : (performance.now() - t0) / 1000 * 0.01 + acc;
    gl.disable(gl.BLEND);
    into(scene);
    draw(P.scene, [["u_color", "3f", CREAM], ["u_transition_color", "3f", WHITE], ["u_noise_scale", "1f", 2.9], ["u_noise_intensity", "1f", 0.5], ["u_scroll_offset", "1f", scroll], ["u_edge_softness", "1f", 0.105], ["u_grain_scale", "1f", GRAIN], ["u_movement_horizontal", "1f", 0], ["u_movement_vertical", "1f", 0.5], ["u_parallax_offset", "1f", (1 - o) - 0.5], ["u_aspect_ratio", "1f", W / H]]);
    into(bA); draw(P.extract, [["u_texture", "t", scene.tex], ["u_transition_color", "3f", WHITE], ["u_base_color", "3f", CREAM]]);
    into(bB); draw(P.blur, [["u_texture", "t", bA.tex], ["u_direction", "2f", [1, 0]], ["u_resolution", "2f", [bA.w, bA.h]], ["u_radius", "1f", 0.15]]);
    into(bA); draw(P.blur, [["u_texture", "t", bB.tex], ["u_direction", "2f", [0, 1]], ["u_resolution", "2f", [bA.w, bA.h]], ["u_radius", "1f", 0.15]]);
    into(null); draw(P.comp, [["u_scene", "t", scene.tex], ["u_bloom", "t", bA.tex], ["u_bloom_intensity", "1f", 0.2], ["u_transition_color", "3f", WHITE]]);
  };
  requestAnimationFrame(frame);
})();
