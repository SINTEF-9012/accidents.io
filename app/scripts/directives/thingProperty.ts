'use strict';

angular.module('mobileMasterApp')
  .directive('thingProperty', (settingsService: SettingsService) => {
    return {
      template: '<span>{{value}}</span>',
		restrict: 'E',
		scope: {
			thing: '=thing',
			property: '=property'
		},
		link: (scope, element : JQuery, attrs) => {
			var type = scope.property.property.type,
				key = scope.property.key;

			scope.key = key;

			scope.$watch('thing[key]', (value) => {

				element.addClass("thing-property-" + key);
				element.addClass("thing-property-" + type.replace(/\s+/g, '-').toLowerCase());

				if (type === 'DateTime') {
					scope.value = value ? value.toLocaleString(window.navigator.userLanguage || window.navigator.language) : '';
				}
				else if (type === 'Double') {
					scope.value = parseFloat(value === null ? 0.0 : value).toLocaleString([]);
				} else if (type === 'Boolean') {
					var v = !!value;
					scope.value = v;

					element.prepend(v ?
						'<span class="glyphicon glyphicon-ok"></span> ' :
						'<span class="glyphicon glyphicon-remove"></span> ');
				} else {
					scope.value = value ? value : '';
				}

				// TODO transfer this stuff somewhere else
				if (key === 'healt') {
					var nbHeart = Math.min(Math.round(value / 0.2), 5);
					if (nbHeart <= 0) {
						element.prepend('<span class="glyphicon glyphicon-heart-empty"></span>');
					} else {
						var heart = $('<span class="glyphicon glyphicon-heart"></span>');
						for (var i = 0; i < nbHeart; ++i) {
							element.prepend(heart.clone());
						}
					}
					scope.value = "";
				} else if (key === 'status' || key === 'triage_status') {
					var light = $('<div class="triage-light"></div>');
					light.css('background', value.toLowerCase());
					element.prepend(light);
				} else if (type === 'String' && key === 'url') {
					scope.value = '';
					var proxy = settingsService.getMediaServerUrl();
					var href =  proxy +'/'+ value;
					var a = $('<a target="_blank"/>').attr('href', href).text('Open');

					if (scope.thing.typeName === 'PictureType' || scope.thing.typeName === 'master:picture') {
						if (value) {
							var img = $('<img class="img-thumbnail"/>').attr('src', proxy + '/thumbnail/' + value);
							a.text('').append(img);
						}
					} 
					else if (scope.thing.typeName === 'VideoType' || scope.thing.typeName === 'master:video') {
						a.addClass('btn btn-default btn-sm');
						a.text(' Play');
						a.prepend($('<span/>').addClass('glyphicon glyphicon-play'));
					} else {
						a.addClass('btn btn-default');
					}

					element.append(a);
				}
			});
		}
    };
  });
