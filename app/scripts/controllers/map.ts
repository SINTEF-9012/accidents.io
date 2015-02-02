/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-ui/angular-ui-router.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-hotkeys/angular-hotkeys.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/leaflet/leaflet.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/googlemaps/google.maps.d.ts" />

/// <reference path="./../references/app.d.ts" />
/// <reference path="./../references/generic.d.ts" />
/// <reference path="./../masterScope.d.ts" />

'use strict';

// Module configuration
angular.module('mobileMasterApp')
.controller('MapCtrl', (
	$scope,
	cfpLoadingBar: any,
	notify : angularNotify,
    masterMap : Master.Map,
    thingModel : ThingModelService,
	$rootScope : MasterScope.Root,
	$state: ng.ui.IStateService,
	$window: ng.IWindowService,
	hotkeys: ng.hotkeys.HotkeysProvider,
	persistentMap: PersistentMap) => {

	masterMap.closePopup();

	masterMap.enableInteractions();
    masterMap.enableScale();
	masterMap.disableSituationOverview();

	persistentMap.restorePersistentLayer(masterMap);

	var jMap = $('#map'), jwindow = $(window);
	var destroyed = false;
	var setLayout = throttle(() => {
		if (destroyed) {
			return;
		}
		masterMap.moveTo(jMap);
	}, 50);

	setLayout();

	window.setImmediate(() => {
		persistentMap.bindMasterMap(masterMap);
		//masterMap.enableMiniMap();
	});

	hotkeys.bindTo($scope)
		.add({
			combo: 'f',
			description: 'Change filters',
			callback: () => $state.go('filters')
		}).add({
			combo: 'o',
			description: 'Map drawing',
			callback: () => $state.go('map.paint')
		}).add({
			combo: 'b',
			description: 'Map background filters',
			callback: () => $state.go('background')
		}).add({
			combo: '0',
			description: 'Center the map on the situation',
			callback: () => masterMap.showOverview()
		});


	var loadStreetMap = (latlng, message, move=false) => {
		var panoramaService = new google.maps.StreetViewService;

		cfpLoadingBar.start();
		panoramaService.getPanoramaByLocation(latlng, 100, (panoData) => {
			cfpLoadingBar.complete();
			if (panoData == null) {
				notify({ message: message, classes: "alert-warning" });
				return;
			}

			if (move) {
				$state.go("streetview", { lat: panoData.location.latLng.lat(), lng: panoData.location.latLng.lng() });
			} else {
				$state.go("streetview", { lat: latlng.lat(), lng: latlng.lng() });
			}
		});
	};

	var contextmenu = (e: L.LeafletMouseEvent) => {
		if ($state.is('map.paint')) {
			return;
		}

		loadStreetMap(new google.maps.LatLng(e.latlng.lat, e.latlng.lng), "Sorry, no streetview found at this position.");
	};

	masterMap.on('contextmenu', contextmenu);

	var slidder = null;
	var setMargin = () => {
		if (!slidder) {
			slidder = $('#view-slidder');
		}
		masterMap.setVerticalTopMargin(slidder.outerHeight());
	};

	jwindow.resize(setLayout);

	$scope.$on('$destroy', () => {
		destroyed = true;
		jwindow.off('resize', setLayout);
		masterMap.off('contextmenu', contextmenu);
		angular.element($window).off('resize', setMargin);
	});

	setMargin();
	angular.element($window).resize(setMargin);

	$scope.goStreetView = () => {
		var center = masterMap.getCenter();
		loadStreetMap(new google.maps.LatLng(center.lat, center.lng),
			"Sorry, no streetview found around the map center. Try to zoom closer to a main road, or " + (L.Browser.touch ? "touch hold" : "rightclick") + " on the map.",
			true);
	};
});
