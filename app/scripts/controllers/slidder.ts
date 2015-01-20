/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-ui/angular-ui-router.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/geojson/geojson.d.ts" />

/// <reference path="./../references/app.d.ts" />
/// <reference path="./../references/generic.d.ts" />

'use strict';

angular.module('mobileMasterApp')
	.controller('SlidderCtrl', (
		$scope: any,
		geocodingService: GeocodingService,
		masterMap : Master.Map,
		notify: angularNotify
	) => {

	//var from = $state.current.name.indexOf('map') === 0 ? 'map' : null;

	$('#view-slidder, #dashboard-btn').on('touchmove', () => false);

	var address = null;
	var search = throttle(() => {
		if (!address) return;
		geocodingService.forward(address, (geojson: GeoJSON.FeatureCollection) => {
			if (!geojson || !geojson.features || !geojson.features.length) {
				notify({ message: "No location found for " + address, classes: "alert-warning" });
				return;
			}

			console.log(geojson.features)
			var feature = geojson.features[0];
			if (feature.bbox) {
				masterMap.fitBounds(new L.LatLngBounds(
					new L.LatLng(feature.bbox[1], feature.bbox[0]),
					new L.LatLng(feature.bbox[3], feature.bbox[2])));
			}
			else if ((<any>feature).center) {
				console.log("only center");
				masterMap.setView(new L.LatLng((<any>feature).center[0], (<any>feature).center[1]), 16);
			}
		});
	}, 1000);

	$scope.locate = (form) => {
		address = form.address;
		search();
	};
});
