// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_PointSize;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_PointSize;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float; 
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  } `
let canvas;
let gl;
let a_Position;
let u_FragColor;
let g_selectedSize = 10.0;           // current selected size
                   // array to hold size per point
let u_PointSize; 
let shapesList = [];
let g_shapeType = "point";
let g_segmentCount = 20;


function syncSlidersToColor() {
    document.getElementById("redSlider").value = g_selectedColor[0] * 100;
    document.getElementById("greenSlider").value = g_selectedColor[1] * 100;
    document.getElementById("blueSlider").value = g_selectedColor[2] * 100;
  }
function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }
  u_PointSize = gl.getUniformLocation(gl.program, 'u_PointSize');
if (!u_PointSize && u_PointSize !== 0) {
  console.log('Failed to get the storage location of u_PointSize');
  return;
}
}



let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // default to white

function addingAllActions() {
  document.getElementById("white").onclick = function() {
    g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // white
  }
  // Update red component
document.getElementById("redSlider").addEventListener("mouseup", function() {
    g_selectedColor[0] = this.value / 100;
  });
  
  // Update green component
  document.getElementById("greenSlider").addEventListener("mouseup", function() {
    g_selectedColor[1] = this.value / 100;
  });
  
  // Update blue component
  document.getElementById("blueSlider").addEventListener("mouseup", function() {
    g_selectedColor[2] = this.value / 100;
  });
  
  document.getElementById("sizeSlider").addEventListener("input", function() {
    g_selectedSize = this.value;
  });

  document.getElementById("clear").onclick = function() {
    shapesList = [];          
    renderAllShapes();       
  };
  document.getElementById("pointMode").onclick = function () {
    g_shapeType = "point";
  };
  
  document.getElementById("triangleMode").onclick = function () {
    g_shapeType = "triangle";
  };
  document.getElementById("circleMode").onclick = function () {
    g_shapeType = "circle";
  };
  
  document.getElementById("segmentSlider").addEventListener("input", function () {
    g_segmentCount = parseInt(this.value);
  });
  
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addingAllActions();
    syncSlidersToColor();
  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown =  click ;

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

canvas.onmousemove = function(ev) {
    if (ev.buttons === 1) {
      click(ev); 
    }
  };
}

function convertCoordinates (ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

return([x,y])
}



function click(ev) {
    let [x, y] = convertCoordinates(ev);
  
    if (g_shapeType === "point") {
      let newPoint = new Point([x, y], g_selectedColor.slice(), parseFloat(g_selectedSize));
      shapesList.push(newPoint);
    } else if (g_shapeType === "triangle") {
    let size = parseFloat(g_selectedSize) / 300;

      let vertices = [
        x, y + size,
        x - size, y - size,
        x + size, y - size
      ];
      let newTriangle = new Triangle(vertices, g_selectedColor.slice());
      shapesList.push(newTriangle);
    } else if (g_shapeType === "circle") {
        let radius = parseFloat(g_selectedSize) / 300; // smaller radius feels better
        let newCircle = new Circle([x, y], radius, g_selectedColor.slice(), g_segmentCount);
        shapesList.push(newCircle);
      }
  
    renderAllShapes();
  }
class Point {
    constructor(position, color, size) {
      this.position = position; // [x, y]
      this.color = color;       // [r, g, b, a]
      this.size = size;         // float
    }
  
    render() {
        // Disable buffer-based position
        gl.disableVertexAttribArray(a_Position);
      
        // Manually provide position
        gl.vertexAttrib3f(a_Position, this.position[0], this.position[1], 0.0);
      
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniform1f(u_PointSize, this.size);
        gl.drawArrays(gl.POINTS, 0, 1);
      }
      
  }
  class Triangle {
    constructor(vertices, color) {
      this.vertices = vertices;
      this.color = color;
  
      // Create and store buffer once
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    }
  
    render() {
        // Create and bind local buffer
        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
      
        // Enable buffer-based position input
        gl.enableVertexAttribArray(a_Position);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
      
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
      
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      
        // ❗ Clean up by disabling buffer-based mode so it doesn't affect the next shape
        gl.disableVertexAttribArray(a_Position);
      }      
  }
  class Circle {
    constructor(center, radius, color, segments) {
      this.center = center;
      this.radius = radius;
      this.color = color;
      this.segments = segments;
      this.vertices = this.computeVertices();
    }
  
    computeVertices() {
      let [cx, cy] = this.center;
      let verts = [cx, cy]; // center vertex (once)
  
      for (let i = 0; i <= this.segments; i++) {
        let angle = (i * 2 * Math.PI) / this.segments;
        let x = cx + this.radius * Math.cos(angle);
        let y = cy + this.radius * Math.sin(angle);
        verts.push(x, y);
      }
  
      return new Float32Array(verts);
    }
  
    render() {
      let buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
  
      gl.enableVertexAttribArray(a_Position);
      gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  
      gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
  
      // ✅ Use TRIANGLE_FAN for proper circle rendering
      gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length / 2);
  
      gl.disableVertexAttribArray(a_Position);
    }
  }
  



  function renderAllShapes() {
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    for (let shape of shapesList) {
      shape.render();
    }
  

}
