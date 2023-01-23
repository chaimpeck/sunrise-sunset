const vs = `
precision mediump float;

attribute vec3 vertPosition;
attribute vec3 vertCOlor;

varying vec3 fragColor;

void main()
{
  gl_Position = vec4(vertPosition, 1.0);
}
`;

const fs = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

float sdSunRays(vec2 p, float radius, float num_rays, float rays_radius) {
  return length(p) - max(radius, rays_radius * step(sin(atan(p.y, p.x) * num_rays), 0.));
}

float sdCircle( vec2 p, float r )
{
    return length(p) - r;
}

void main()
{
  vec2 uv = gl_FragCoord.xy / u_resolution;

  float slowed_time = u_time * .6;
  
  vec2 sun_pos = vec2(
    (sin(slowed_time) + 1.) * .5,
    (cos(slowed_time) + 1.) - 1.
  );
  vec2 moon_pos = vec2(
    (sin(slowed_time + 3.14) + 1.) * .5,
    (cos(slowed_time + 3.14) + 1.) - 1.
  );

  float sun_radius = .1;
  float num_rays = 36.;
  float rays_radius = .6;

  vec3 background_color = vec3(0., .1, .8) * uv.y * sun_pos.y + .2;
  vec3 sun_color = vec3(.9, .8, .1);
  vec3 moon_color = vec3(.8, .8, 1.) * (1.8 - uv.y);
  vec3 foreground_color = vec3(.1, .9, .4) * 3. * uv.y * sun_pos.y + .3;


  vec2 p = uv - sun_pos;

  float d_sun = sdSunRays(p, sun_radius, num_rays, rays_radius);
  vec3 color = mix(sun_color, background_color, smoothstep(0., 100. / u_resolution.x, d_sun));

  float d_moon = length(uv - moon_pos);
  color = mix(color, moon_color, step(d_moon, .1));

  color = mix(foreground_color, color, step(.6, (sin(u_time + uv.x  * 10.) + 4.) * uv.y));

  gl_FragColor = vec4(color, 1.);
}
`;

(() => {
  const canvas = document.getElementById("main-canvas");
  const gl = canvas.getContext("webgl", {
    powerPreference: "high-performance",
  });

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(vertexShader, vs);
  gl.shaderSource(fragmentShader, fs);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(
      "Error compiling vertex shader:",
      gl.getShaderInfoLog(vertexShader)
    );
    return;
  }
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(
      "Error compiling fragment shader:",
      gl.getShaderInfoLog(fragmentShader)
    );
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Error linking programing", gl.getProgramInfoLog(program));
    return;
  }
  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error("Error validating program", gl.getPRogramInfoLog(program));
    return;
  }

  const vertices = [-1, 1, 0.0, -1, -1, 0.0, 1, -1, 0.0, 1, 1, 0.0];
  const indices = [3, 2, 1, 3, 1, 0];

  const vertexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  const positionAttribLocation = gl.getAttribLocation(program, "vertPosition");
  gl.vertexAttribPointer(
    positionAttribLocation,
    3,
    gl.FLOAT,
    gl.FALSE,
    3 * Float32Array.BYTES_PER_ELEMENT,
    0
  );

  gl.enableVertexAttribArray(positionAttribLocation);

  const updateCanvas = (timeStamp) => {
    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.75, 0.85, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    gl.useProgram(program);
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(timeLocation, timeStamp / 1000);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    window.requestAnimationFrame(updateCanvas);
  };

  window.onresize = updateCanvas;

  updateCanvas();
})();
