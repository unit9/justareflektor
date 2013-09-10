justareflektor
==============
http://www.justareflektor.com

JUST A REFLEKTOR is an interactive short film that explores the themes in Arcade Fire’s “Reflektor.” The film bundles WebGL, WebSockets, getUserMedia and WebAudio into an experience for two devices: your computer and your smartphone. The project was directed by Vincent Morisset and developed by Unit9, AATOAA, and Google’s Creative Lab.

This repository does not include any third party libraries and is provided
for reference.

### Tech Page

Just A Reflektor: Sandbox is a JavaScript library made to create, manipulate, test and share post-processing effects in the web browser through WebGL. It was created for Just A Reflektor in order to illustrate how many of the effects in the project were created. The code for the [Tech Page](http://www.justareflektor.com/tech) is a separate module and can be found in [/sandbox](https://github.com/unit9/justareflektor/tree/master/sandbox).

### Building front end

Desktop and mobile projects are designed to be independent. They do not share any code and can be freely modified without risk of affecting one another.
```
app/src/desktop
```
and
```
app/src/mobile
```

Both desktop and mobile projects are set up using Grunt (http://gruntjs.com/).

First, you need to install all development dependencies. To do this, enter either desktop or mobile source folder and run the below command (only once per development machine):
```
sudo npm install
```

If you do not have Grunt installed, you may need to install it first:
```
sudo npm install -g grunt-cli
```
and / or install it locally to your project with the following command:
```
sudo npm install grunt --save-dev
```

Then you can already build the project:
```
grunt release
```

To build development version (not minified), run:
```
grunt debug
```

If you plan longer development, run a watcher task that will keep building required parts of the project as you save modified files:
```
grunt watch
```
