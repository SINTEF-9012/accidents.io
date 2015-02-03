/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/googlemaps/google.maps.d.ts" />

/// <reference path="./../references/generic.d.ts" />

'use strict';

angular.module('mobileMasterApp').service('streetViewService', function (
	notify: angularNotify,
	mapPopupService: MapPopupService,
	thingModel: ThingModelService) {

	var streetViewMarkers: { [id: string]: google.maps.Marker } = {};
	var panorama: google.maps.StreetViewPanorama = null;

	var infoWindow = new google.maps.InfoWindow({
		content: '',
		maxWidth: 280
	});

	var updateMarkerMap = (marker: google.maps.Marker) => {
		if (!panorama || !panorama.getPosition()) {
			marker.setMap(null);
			return;
		}
		try {
			if (google.maps.geometry.spherical.computeDistanceBetween(
				panorama.getPosition(), marker.getPosition()) > 100) {
				marker.setMap(null);
			} else if (marker.getMap() !== panorama) {
				marker.setMap(panorama);
			}
		} catch (e) {
			marker.setMap(null);
		}
	};

	var icon = new google.maps.MarkerImage('/images/gmap-risk-icon.png', new google.maps.Size(64, 64))
	icon.scaledSize = new google.maps.Size(64, 64);

	var parseThing = (thing: ThingModel.Thing) => {
		var location = thing.LocationLatLng();

		if (location && !isNaN(location.Latitude) && !isNaN(location.Longitude)) {
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(location.Latitude, location.Longitude),
				//draggable: true,
				icon: icon
			});
			google.maps.event.addListener(marker, 'click',() => {
				var content = mapPopupService.generate(thing);
				content.style.height = '143px';
				infoWindow.setContent(content);
				infoWindow.open(panorama, marker);

				if (window.getSelection) {
					if ((<any>window.getSelection()).empty) {  // Chrome
						(<any>window.getSelection()).empty();
					} else if (window.getSelection().removeAllRanges) {  // Firefox
						window.getSelection().removeAllRanges();
					}
				} else if (document.selection) {  // IE?
					document.selection.empty();
				}
			});
			updateMarkerMap(marker);
			streetViewMarkers[thing.ID] = marker;
		}
	};

	_.each(thingModel.warehouse.Things, parseThing);

	var observer = {
		New: parseThing,
		Updated: (thing: ThingModel.Thing) => {
			if (streetViewMarkers.hasOwnProperty(thing.ID)) {
				var location = thing.LocationLatLng();

				if (location && !isNaN(location.Latitude) && !isNaN(location.Longitude)) {
					streetViewMarkers[thing.ID].setPosition(
						new google.maps.LatLng(location.Latitude, location.Longitude));
					updateMarkerMap(streetViewMarkers[thing.ID]);
				}
			}
		},
		Deleted: (thing: ThingModel.Thing) => {
			if (streetViewMarkers.hasOwnProperty(thing.ID)) {
				streetViewMarkers[thing.ID].setMap(null);
				delete streetViewMarkers[thing.ID];
			}
		},
		Define: () => {}
	};

	thingModel.warehouse.RegisterObserver(observer);

	this.create = (container: HTMLElement) : google.maps.StreetViewPanorama => {
		panorama = new google.maps.StreetViewPanorama(container, {
			zoomControl:false,
			addressControl: false
		});

		google.maps.event.addListener(panorama, 'position_changed',() => {
			window.setImmediate(() => _.each(streetViewMarkers, updateMarkerMap));
		});

		return panorama;
	};

	this.disable = () => {
		panorama = null;
	};
});
 
