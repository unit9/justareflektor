Just A Reflektor: Sandbox
=========================

__JUST A REFLEKTOR: Sandbox__ is a JavaScript library made to create, manipulate, test, and share post-processing effects in the browser through [WebGL](http://get.webgl.org/). It was created for [JUST A REFLEKTOR](http://justareflektor.com/) in order to illustrate how many of the effects in the project were created. This can be viewed on the [tech page](http://justareflektor.com/tech).

### Overview

The `Sandbox` is itself an instance based class, check out its usage [here](#usage). However, it's made up of many pieces. When you create a `Sandbox`, it internally creates:

+ `Sandbox.Graph`: This is the grid based view of various effects.
+ `Sandbox.Viewport`: This is the output view.
+ `Sandbox.Inspector`: This is the panel on the side to change views as well as manipulate or add effects.

Each of these files can be seen in the [`/src/`](https://github.com/unit9/justareflektor/tree/master/sandbox/src) directory. These classes create the UI of any given sandbox. What make up the actual effects however are nodes. These can be seen and referenced in `Sandbox.Nodes`. Each one of these effects inherits a set of properties and methods from `Sandbox.Node`. Often these nodes come with shaders. Likewise nodes, and shaders can be found in the `/src/` directory.

### Usage

Download the [minified library](https://raw.github.com/unit9/justareflektor/master/sandbox/build/sandbox.min.js) and include it in your html. Alternatively see how to [build the library yourself](#custom-build).

```html
<script src="js/sandbox.min.js"></script>
```

Here is boilerplate html in order to instantiate a fresh sandbox with no effects in it:

```html
<!doctype html>
<html>
  <head>
    <title>Just A Reflektor: Sandbox</title>
  </head>
  <body>
    <div id="content"></div>
    <script src="./build/sandbox.min.js"></script>
    <script>

      var sandbox = new Sandbox({
        width: 640,
        height: 480,
        size: 25
      }).appendTo(document.querySelector('#content'));

      var loop = function() {
        sandbox.update();
        requestAnimationFrame(loop);
      };

      loop();

    </script>
  </body>
</html>
```

If you'd like the webcam node to work, you'll also have to run a local server. Most operating systems have python, so an easy to get this running is to type this into your commandline:

```
cd sandbox
python -m SimpleHTTPServer
```

### Custom Build

The sandbox uses [nodejs](http://nodejs.org/) in order to build source files. You'll first want to install that. Next you'll want to install [node-minify](https://npmjs.org/package/node-minify):

```
cd sandbox/utils
npm install node-minify
```

Then open up `./utils/build.js` in the text editor your choice. You'll see an array at the top called `files`. This is the list and order of source files that get compiled to the built source. Feel free to add, subtract, or modify based on your needs. Then build your project:

```
node sandbox/utils/build
```

### Create Custom Effects

In a few lines of JavaScript you can define your own effect that can be used in the `Sandbox`. Every node has its own `THREE.Scene`, `THREE.Camera`, and quad which is a `THREE.Mesh`. Most commonly found are shaders attached to the quad to manipulate the output which in turn can be displayed or further manipulated. Below is a dummy template for creating a custom effect:

```javascript
(function() {

  var MyEffect = Sandbox.Nodes.MyEffect = function() {

    // This creates a THREE.Scene, THREE.Camera, and Quad.
    Sandbox.Node.call(this);

    // Add your custom shader or any three.js related contributions to
    // your effects scene.
    this.shader = this.quad.material = new THREE.ShaderMaterial();

    // Specify any inputs.
    this.inputs.buffer = null;
    // Specify outputs as well.
    this.outputs.buffer = this.createBuffer();
    // this.buffer represents a "ram preview" for the Sandbox.Graph viewed.
    this.buffer = this.outputs.buffer;  // Can be a buffer or THREE.Texture.

    // Specify any parameters
    this.params = {
      amount: { value: 5 }                                // Numbers are valid
      focal: { value: 0.5, min: 0, max: 1, step: 0.001 }  // Constrained Numbers
      checked: { value: false }                           // Booleans are valid
      options: { value: 2, options: [1, 2, 3, 4, 5] }     // Arrays are valid
    };

    // Generate HTML for Sandbox.Graph injection.
    this.html = _.template(Sandbox.Graph.Templates.canvas, this)
      + _.template(Sandbox.Graph.Templates.description, this);

    // This array keeps track of items worth disposing in three.js.
    this.destructables.push(this.buffer);

  };

  _.extend(MyEffect.prototype, Sandbox.Node.prototype, {

    name: 'My Effect',  // This is the displayed name.

    /**
     * Run any logic to update the dimensions of your FBO.
     */
    resize: function(width, height) {

      // The maximum allowed width for the Sandbox
      var scale = Math.min(1, 1920 / width);

      var params = {
        width: width * scale,
        height: height * scale
      };

      // Remove our current buffer
      this.dispose(this.buffer);
      // Create a new one that's based on the dimensions
      this.buffer = this.outputs.buffer = this.createBuffer(params);

      return this;

    },

    /**
     * To be executed on requestAnimationFrame. Intended for updating
     * parameters and "ram preview" for Sandbox.Graph.
     */
    update: function() {

      // Only update our output if we have our expected inputs/
      if (this.inputs.buffer) {

        // Update the input texture for our shader.
        if (this.shader.uniforms.texture.value !== this.inputs.buffer) {
          this.shader.uniforms.texture.value = this.inputs.buffer;
        }

        // Update any other params or variables.

        // Set a variable to a parameter through this.getParam(key);

        this.renderer.render(this.scene, this.camera, this.buffer, false);

      }

      return this.trigger('update');  // Bubbles update event to Sandbox.Graph.

    },

    /**
     * To be executed when the user's mouse moves over the viewport.
     */
    onMouseMove: function(x, y) {

      var mx = x, my = 1 - y;

      // Update any mouse related variables based on mx and my.

      return this;

    }

  });

})();
```

Once created import the script after the sandbox, but before you instantiate your instance of `Sandbox`. Your effect will be automatically included in the list of nodes in the sandbox.