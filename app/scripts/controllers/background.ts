/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/moment/moment.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-ui/angular-ui-router.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/lodash/lodash.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-hotkeys/angular-hotkeys.d.ts" />

/// <reference path="./../references/app.d.ts" />
/// <reference path="./../masterScope.d.ts" />

'use strict';

angular.module('mobileMasterApp')
	.controller('BackgroundCtrl', (
	$rootScope: MasterScope.Root,
	settingsService: SettingsService,
	$scope : MasterScope.Background,
	hotkeys: ng.hotkeys.HotkeysProvider,
	$state: ng.ui.IStateService,
	persistentMap: PersistentMap,
	masterMap: Master.Map) => {

	$scope.mediaServerUrl = settingsService.getMediaServerUrl();

	// Register the layers into the scope
	$scope.layers = masterMap.getTilesLayers();


	$scope.layerClick = (layer: MasterScope.Layer) => {

		if (!layer.active) {
			angular.forEach($scope.layers, (iLayer: MasterScope.Layer) => {
				masterMap.hideTileLayer(iLayer.name);
			});

			masterMap.showTileLayer(layer.name);
			persistentMap.saveCurrentLayer(layer);
		}
	};

	$scope.overlays = {};

	_.each(persistentMap.getHiddenOverlays(), (v) => {
		$scope.overlays[v] = false;
	});

	$scope.$watchCollection('overlays', (overlays) => {
		_.each(overlays, (v, key) => {
			if (v) {
				persistentMap.showOverlay(key);
			} else {
				persistentMap.hideOverlay(key);
			}
		});
	});

	$scope.zoomToOverlay = (thing: any) => {

		try {
			var bounds = new L.LatLngBounds([
				new L.LatLng(thing.topleft.Latitude, thing.topleft.Longitude),
				new L.LatLng(thing.bottomright.Latitude, thing.bottomright.Longitude)
			]);

			window.setTimeout(() => {
				masterMap.fitBounds(bounds);
			}, 33);

			$state.go('map.slidder');
		} catch (e) {

		} 
	};


});
