var app = app || {};

(function ($) {
	'use strict';

	// 
	// -----------------------
	app.SlidersViewController = Backbone.View.extend({

		el: '#sliders',

		initialize: function () {
			this._audioNodes = this.model.get('audioNodes');
			
			for (var k in this._audioNodes) {
				var nodeDiv = this.createNodeDiv(this._audioNodes[k]);
				this.$el.append(nodeDiv);
			}
		},
		createNodeDiv : function (node) {
			var div = $('<div class="nodeSettings"></div>', { 
				id: node.type, 
				text: node.type 
			});

			for (var l in node) {
				if (node[l].value != null) {

					// CREATE AND SETUP INPUT DIV
					var param = node[l];
					var id = node.type+param.name;
					var input = $('<input>', { 
						type : 'range', 
						id: id,
						min: param.minValue,
    				max: param.maxValue,
    				value: param.value,
    				name: param.name,
    				step: (param.maxValue-param.minValue)/50
	      	});
	      	input.change( function() {
	      		var name = this.name;
				    node[name].value = this.value;
				    var num = Number(this.value);
				    $('label[for="' + this.id + '"]').html(this.name + ': ' + num.toPrecision(4));
				  });

	      	// LABEL FOR INPUT
	      	var label = $('<label>', {
	      		for: id,
	      	}).html(param.name + ': ' + param.value.toPrecision(4));

	      	div.append(label);
	      	div.append(input);

	      }
			}

			return div;
		}
	})
})(jQuery);