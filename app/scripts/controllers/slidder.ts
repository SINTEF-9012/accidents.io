/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-ui/angular-ui-router.d.ts" />

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

	$('#view-slidder, #dashboard-btn').on('touchmove', () => false);

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

			var mapView = response.View[0].Result[0].Location.MapView;
			masterMap.fitBounds(new L.LatLngBounds(
				new L.LatLng(mapView.BottomRight.Latitude, mapView.BottomRight.Longitude),
				new L.LatLng(mapView.TopLeft.Latitude, mapView.TopLeft.Longitude)));
		});
	}, 1000);

	$scope.locate = (form) => {
		if (form) {
			address = form.address;
			search();
		}
	};
});
