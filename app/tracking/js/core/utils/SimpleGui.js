(function (window,document) {
	var SimpleGui = {

		domElement:null,
		width:65,
		height:30,
		allButtons:[],
		buttonClasses:{},


		//date calc
		fps:60.0,
		time:0,lastFp:0,o:0,


		//init the GUI
		init: function() {
			SimpleGui.time = SimpleGui.lastTime = SimpleGui.lastFp = Date.now();
			SimpleGui.domElement = document.createElement('div');
			$(SimpleGui.domElement).addClass('SimpleGui');
			$(SimpleGui.domElement).css({
				width:SimpleGui.width+'px',
				height:SimpleGui.height+'px',
			})
			$(SimpleGui.domElement).html('<div id="guifps">FPS: 60</div>');
			SimpleGui.update();
		},

		//add Button
		addButton: function(label,classn,callback) {
			if (!SimpleGui.buttonClasses[classn]) SimpleGui.buttonClasses[classn] = [];


			var btn = document.createElement('div');
			$(btn).addClass('SimpleGuiButton').text(label);
			SimpleGui.width += 20+label.length*2;
			$(SimpleGui.domElement).css('width',SimpleGui.width+'px');
			$(SimpleGui.domElement).append(btn);

			$(btn).mousedown(callback);
			$(btn).mousedown(function(){
				SimpleGui.toggleButton(btn,classn);
			});	

			SimpleGui.buttonClasses[classn].push(btn);
			SimpleGui.allButtons.push(btn);
		},


		//update
		update: function() {
			window.requestAnimationFrame(SimpleGui.update);
			SimpleGui.time = Date.now();
	        SimpleGui.o++;

	        if (SimpleGui.time>SimpleGui.lastFp+1000) {
	        	SimpleGui.fps =  Math.round(SimpleGui.o * 1000 / (SimpleGui.time- SimpleGui.lastFp));
	            SimpleGui.lastFp=SimpleGui.time;
	        	SimpleGui.o=0;
	        	$('#guifps').text('FPS: '+SimpleGui.fps);
	        }
		},

		//add slider
		addSlider: function(label,width,min,max,value,callback) {
			//create slider
	        var nid = Math.floor(Math.random()*99999999);
			var slider = document.createElement('div');
			var d = $('<div>'+label+'</div>');
			$(slider).addClass("slider"+nid)
				.css('width',width+'px')
				.css('display','inline-block')
				.css('margin-left','10px')
				.append(d);
			d.css('font-size','0.5em');
	        d.text(label+' '+value.toPrecision(3));

			//add to main
			$(SimpleGui.domElement).append(slider);
			SimpleGui.width += width+12;
			$(SimpleGui.domElement).css('width',SimpleGui.width+'px');

			/*function( event, ui ) {
	            $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
	        }*/

	        //jquery ui
	        $( ".slider"+nid ).slider({
	        	range: false,
	            min: min,
	            max: max,
	            step: (max-min)/width*0.5,
	            values: [ value],
	            slide: function( event, ui ) {
	            	console.log(ui,label);
	            	d.text(label+' '+ui.values[ 0 ].toPrecision(3));
	            	if (callback) callback(ui.values[ 0 ]);
	        	}
	        });
		},

		//add slider
		addRangeSlider: function(label,width,min,max,valueMin,valueMax,callback) {

			//create slider
	        var nid = Math.floor(Math.random()*99999999);
			var slider = document.createElement('div');
			var d = $('<div>'+label+'</div>');
			$(slider).addClass("slider"+nid)
				.css('width',width+'px')
				.css('display','inline-block')
				.css('margin-left','10px')
				.append(d);
			d.css('font-size','0.5em');
	        d.text(label+' '+valueMin.toPrecision(3)+' - '+valueMax.toPrecision(3));

			//add to main
			$(SimpleGui.domElement).append(slider);
			SimpleGui.width += width+12;
			$(SimpleGui.domElement).css('width',SimpleGui.width+'px');

			/*function( event, ui ) {
	            $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
	        }*/

	        //jquery ui
	        $( ".slider"+nid ).slider({
	        	range: true,
	            min: min,
	            max: max,
	            step: (max-min)/width*0.5,
	            values: [ valueMin,valueMax],
	            slide: function( event, ui ) {
	            	console.log(ui,label);
	            	d.text(label+' '+ui.values[ 0 ].toPrecision(3)+' - '+ui.values[ 1 ].toPrecision(3));
	            	if (callback) callback(ui.values[ 0 ],ui.values[ 1]);
	        	}
	        });
		},

		//mouseDown
		mouseDown: function(e) {

		},


		toggleButton: function(target,classn) {
			for (var i=0; i<SimpleGui.buttonClasses[classn].length; i++) {
				$(SimpleGui.buttonClasses[classn][i]).toggleClass('active') //SimpleGui.buttonClasses[classn][i] === target || i===target
			}
		}
	};

	window.SimpleGui = SimpleGui;
})(window,document)