justareflektor
==============
http://www.justareflektor.com

This is the repository of the "Just A Reflektor" client side source developed by Google Creative Lab, AATOAA Inc. and UNIT9 Ltd.

The source is not including third party libraries so will require some work to get up and running - and is provided primarily to consult not to rebuild the application.

### Tech Page

The Google Labs team have created a self standing module which can be found in 'app/tech' that should be complete and an easy installation to perform experiments with some of the site code.

### Building front end

Desktop and mobile projects are designed to be independent. They do not share any code and can be freely modified without risk of affecting one another.
```
client/app/src/desktop
```
and
```
client/app/src/mobile
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
