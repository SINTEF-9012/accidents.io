/// <reference path="../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="../../bower_components/DefinitelyTyped/angular-ui/angular-ui-router.d.ts" />
/// <reference path="../../bower_components/DefinitelyTyped/lodash/lodash.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/googlemaps/google.maps.d.ts" />

/// <reference path="./../references/generic.d.ts" />
/// <reference path="./../references/app.d.ts" />

'use strict';

angular.module('mobileMasterApp')
	.controller('StreetViewCtrl', (
		$scope,
		$state: ng.ui.IStateService,
		//$http: ng.IHttpService,
		thingModel: ThingModelService,
		geocodingService: GeocodingService,
		$stateParams,
		mapPopupService: MapPopupService,
		notify: angularNotify
		/*$rootScope: MasterScope.Root,
		$state: ng.ui.IStateService,
		settingsService: SettingsService*/) => {

	// The location can be specified as state parameters
	var position;
	if ($stateParams.lat && $stateParams.lng) {
		position = new google.maps.LatLng($stateParams.lat, $stateParams.lng);
	} else {
		position = new google.maps.LatLng(59.96058831566811, 10.764702558517458);
	}

	var panoramaService = new google.maps.StreetViewService;

	var panorama = new google.maps.StreetViewPanorama(document.getElementById("streetview"), {
		position: position,
		addressControl: false
	});

	panoramaService.getPanoramaByLocation(position, 42, (panoData) => {
		if (panoData == null) {
			notify({ message: "Sorry, no streetview found at this position", classes: "alert-warning" });
			$state.go('map.slidder');
			return;
		}

		var panoCenter = panoData.location.latLng;
		var heading = google.maps.geometry.spherical.computeHeading(panoCenter, position);
		var pov = panorama.getPov();
		pov.heading = heading;
		panorama.setPov(pov);
	});
	var streetViewMarkers: { [id: string]: google.maps.Marker } = {};

	var updateMarkerMap = (marker: google.maps.Marker) => {
		try {
			if (google.maps.geometry.spherical.computeDistanceBetween(
				panorama.getPosition() || position, marker.getPosition()) > 100) {
				marker.setMap(null);
			} else if (marker.getMap() !== panorama) {
				marker.setMap(panorama);
			}
		} catch (e) {
			marker.setMap(null);
		}
	};

	google.maps.event.addListener(panorama, 'position_changed',() => {
		window.setImmediate(() => _.each(streetViewMarkers, updateMarkerMap));
	});

	var infoWindow = new google.maps.InfoWindow({
		content: '',
		maxWidth: 280
	});

	/*google.maps.event.addDomListener(document.getElementById("streetview"), 'dblclick',(e) => {
		e.preventDefault();
		var posBefore = panorama.getPosition(),
			povBefore = panorama.getPov();

		google.maps.event.addListenerOnce(panorama, "pov_changed",(e) => {
			console.log("lapin", e)
			new google.maps.Marker({
				map: panorama,
				position: panorama.getPosition(),
				draggable: true
			});
			
			panorama.setPosition(posBefore);
			panorama.setPov(povBefore);
		});
		console.log("CANARD", e)
	});

	window.panorama = panorama;*/

	//$('#streetview').click(() => alert("canard"))

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

	$scope.$on('$destroy', () => {
		thingModel.warehouse.UnregisterObserver(observer);
	});

	$('header').on('touchmove',() => false);

	var address = null;
	var search = throttle(() => {
		if (!address) return;
		geocodingService.forward(address,(data: any) => {
			var response = data.Response;
			if (!response || !response.View || !response.View.length ||
				!response.View[0].Result || !response.View[0].Result.length ||
				!response.View[0].Result[0].Location) {
				notify({ message: "No location found for " + address, classes: "alert-warning" });
				return;
			}

			var navPos = response.View[0].Result[0].Location.NavigationPosition[0];
			position = new google.maps.LatLng(navPos.Latitude, navPos.Longitude);
			panorama.setPosition(position);
		});
	}, 1000);

	$scope.locate = (form) => {
		if (form) {
			address = form.address;
			search();
		}
	};


	var addMarker: google.maps.Marker = null;

	$scope.add = () => {
		$scope.addMode = true;
		var pos = google.maps.geometry.spherical.computeOffset(panorama.getPosition(), 6, panorama.getPov().heading);
		addMarker = new google.maps.Marker({
			position: pos,
			map: panorama,
			icon: icon,
			draggable: true
		});
	};

	$scope.validAdd = () => {
		var pos = addMarker.getPosition();
		$state.go("add", { lat: pos.lat(), lng: pos.lng() });
	};

	$scope.cancelAdd = () => {
		addMarker.setMap(null);
		$scope.addMode = false;
	};
});
