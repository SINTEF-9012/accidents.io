/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />

/// <reference path="./../references/generic.d.ts" />

'use strict';

angular.module('mobileMasterApp').service('mapPopupService', function (
	$state: ng.ui.IStateService,
	$stateParams,
	thingModel: ThingModelService,
	settingsService: SettingsService,
	itsa: ThingIdentifierService) {

	this.generate = (thing: ThingModel.Thing) : HTMLElement => {
		var content = $('<div />');
		var toState = itsa.risk(thing) ? 'risk' : (itsa.tweet(thing) ?
			'tweet' : (itsa.incident(thing) ? 'accident' : (itsa.media(thing) ? 'media' : 'thing')));

		content.click(() => {
			$state.go(toState, {
				ID: thing.ID,
				from: $stateParams.from ? $stateParams.from : 'map'
			});
		});

		var name = thingModel.GetThingName(thing);

		if (!name) {
			if (itsa.patient(thing)) {
				name = "Patient " + thing.ID;
			} else {
				name = thing.Type ? thing.Type.Name : 'unknown object';
			}
		}

		$('<div>').text((<any>_).trunc(name, 140)).appendTo(content);
		var url: string = null, img = $('<img />');
		if (itsa.media(thing)) {
			url = thing.String('url');
			if (url) {
				url = settingsService.getMediaServerUrl() +
					"/thumbnail/" + url;
			}
		} else if (thing.Type && thing.Type.Name.indexOf("aftenposten") !== -1 &&
			thing.HasProperty("bilde")) {
			url = thing.String('bilde');
			if (url) {
				url = settingsService.getMediaServerUrl() +
					"/thumbnail/http://mm.aftenposten.no/2014/09/04-sykkel/data/images/600_" + url;
			}
		} else if (thing.HasProperty("streetview")) {
			url = thing.String('streetview');
			if (url) {
				url = settingsService.getMediaServerUrl() +
					"/thumbnail/" + url;
			}
		}

		if (!url) {
			content.addClass('without-media');
		} else {
			content.addClass('with-media');
			content.prepend(img.attr('src', url));
		}

		return content.get(0);
	};
});
