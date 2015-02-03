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
		notify: angularNotify,
		streetViewService: StreetViewService
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

	var panorama = streetViewService.create(document.getElementById("streetview"));
	panorama.setPosition(position);

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

	//var size = new google.maps.Size(124, 180);
	var size = new google.maps.Size(80, 116);
	var icon = new google.maps.MarkerImage('/images/utmost/move.png', size);
	icon.scaledSize = size;

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

	$scope.$on('$destroy', () => {
		streetViewService.disable();
	});
});
