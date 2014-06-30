/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/leaflet/leaflet.d.ts" />
/// <reference path="./../../bower_components/PruneCluster/PruneCluster.ts" />
/// <reference path="./../../bower_components/PruneCluster/LeafletAdapter.ts" />
/// <reference path="./../references/Touch.d.ts" />
/// <reference path="./../references/NodeMaster.d.ts" />
/// <reference path="./../references/generic.d.ts" />
/// <reference path="./../references/app.d.ts" />
/// <reference path="./../masterScope.d.ts" />
'use strict';

// Module configuration
angular.module('mobileMasterApp')
.controller('MapCtrl', function (
    $scope,
    masterMap : Master.Map,
    thingModel : ThingModelService,
	$state: any,
	$window: ng.IWindowService,
	persistentLocalization: PersistentLocalization) {

    persistentLocalization.bindMasterMap(masterMap);
    persistentLocalization.restorePersistentLayer(masterMap);


	masterMap.closePopup();

    masterMap.enableInteractions();
    masterMap.enableMiniMap();
    masterMap.enableScale();
	masterMap.disableSituationOverview();

	masterMap.moveTo(document.getElementById('map'));

	//cluster.Cluster.Size = 100;

	/*(<any>cluster).BuildLeafletMarker = (rawMarker: PruneCluster.Marker, location: L.LatLng) => {
		var id = rawMarker.data.ID;
		var marker = new L.Marker(location, { icon: masterMap.createMasterIconWithId(id, $scope), draggable: true });
		marker.on('dragstart', (e) => {
			e.marker = marker;
			var pos = marker.getLatLng();
			marker._oldLatLng = new L.LatLng(pos.lat, pos.lng);
			masterMap.closePopup();
			masterMap.fire('markerdragstart', e);
		}).on('dragend', (e) => {
			e.marker = marker;
			window.setImmediate(()=> {
				masterMap.fire('markerdragend', e);
			});

			var newLatLng = marker.getLatLng(),
				oldLatLng = marker._oldLatLng;

			var newProj = masterMap.project(newLatLng),
				oldProj = masterMap.project(oldLatLng);

			// Pythagore
			var distance = Math.sqrt((oldProj.x - newProj.x) * (oldProj.x - newProj.x) +
			(oldProj.y - newProj.y) * (oldProj.y - newProj.y)); 


			if (distance > 28) {
                masterMap.panTo(newLatLng);
                $state.go('map.thing.order', { id: id });
				marker.setLatLng(oldLatLng);
			} else {
				window.setImmediate(()=> {
					marker.setLatLng(oldLatLng);
				});
			}

		}).on('click', () => {
			$state.go('thing', { id: id });
		}).on('drag', (e) => {
			var loc = marker.getLatLng();
			dragLineLatLng[1].lat = loc.lat;
			dragLineLatLng[1].lng = loc.lng;
			dragLine.setLatLngs(dragLineLatLng);
			if (!onMap) {
				dragLine.addTo(masterMap).bringToBack();
				onMap = true;
			}
		});

		return marker;
	}*/

    var markersThings : {[ID: string] : PruneCluster.Marker} = {};

    var cpt = 0;

	var canChangePosition = true, updatePositionsAtEnd = false;

	var dragLineLatLng = [L.latLng(0, 0), L.latLng(0, 0)];
	var dragLine = L.polyline(dragLineLatLng, {'clickable': false });
	var onMap = false;

    // Manage markers
    function updatePatientsPositions() {
        masterMap.clearMiniMap();

	    angular.forEach($scope.things, (thing: MasterScope.Thing, ID: string) => {

				if (!thing.visible) {
					return;
				}

				var loc = thing.location;
				if (!loc || isNaN(loc.x) || isNaN(loc.y)) {
					return;
				}

				var location = new L.LatLng(loc.x, loc.y);

	        masterMap.drawMiniMapPoint(location, { r: 255, g: 0, b: 0 });

			if (markersThings[ID]) {
				markersThings[ID].position.lat = loc.x;
				markersThings[ID].position.lng = loc.y;
			} else {
				var m = new PruneCluster.Marker(loc.x, loc.y, {
					ID: ID
				});

			    //cluster.RegisterMarker(m);
				markersThings[ID] = m;



			    }
		    });

			angular.forEach(markersThings, (marker: L.Marker, ID: string) => {
				var scopeThing = $scope.things[ID];
			    if (!scopeThing || !scopeThing.visible) {
					masterMap.removeLayer(marker);
				    delete markersThings[ID];
			    }
			});
		masterMap.renderMiniMap();
	    //cluster.ProcessView();
    }

	//masterMap.addLayer(cluster);

    $scope.$watch('things', function() {
		// TODO send an event when it's OK
		if (canChangePosition) {
            updatePatientsPositions();
        } else {
            updatePositionsAtEnd = true;
        }
    }, true);

	var endTimeoutId = 0, drag = false;
	masterMap.on('movestart zoomstart markerdragstart', e=> {
		canChangePosition = false;

		if (e.type === "markerdragstart") {
			drag = true;
		}

		if (endTimeoutId) {
			window.clearTimeout(endTimeoutId);
			endTimeoutId = 0;
		}
	}).on('moveend zoomend markerdragend', e=> {
		if (!endTimeoutId) {
			if (drag === false || e.type === "markerdragend") {
				drag = false;
				endTimeoutId = window.setTimeout(()=> {
					endTimeoutId = 0;
					canChangePosition = true;

					if (updatePositionsAtEnd) {
						updatePatientsPositions();
					}
				}, 300);
			}
		}
	});

    masterMap.on('zoomstart markerdragstart', ()=> {
	    $('body').addClass("disable-markers-animations");
    }).on('zoomend markerdragend', (e) => {
	    if (drag === false || e.type === "markerdragend") {
		    $('body').removeClass("disable-markers-animations");
	    }
    });

    //masterMap.addLayer(cluster);


	var mousemove = (e: L.LeafletMouseEvent)=> {
	};

	window.lapin = masterMap;
	var throttledUpdate = null;
	masterMap.on('markerdragstart', (e: L.Marker) => {
		if (!e.marker) {
			return;
		}
		var mLatLng = e.marker.getLatLng();
		dragLineLatLng[0] = new L.LatLng(mLatLng.lat, mLatLng.lng);

		//		dragLine.redraw();
		//		masterMap.on('mousemove', mousemove);

	}).on('markerdragend', (e: L.Marker) => {
			//		masterMap.off('mousemove', mousemove);
			if (onMap) {
				masterMap.removeLayer(dragLine);
				onMap = false;
			}
	}).on('drag', () => {
		if (masterMap._renderer) {
			if (!throttledUpdate) {
				throttledUpdate = L.Util.throttle(masterMap._renderer._update, 100, masterMap._renderer);
			}

			throttledUpdate();
		}
	});


	masterMap.on('contextmenu', (e: L.LeafletMouseEvent) => {
        // TODO UGLY
        if (!$state.is('map.thing.order') && !$state.is('thing.edit')) {
			$state.go('main.add', e.latlng);
		}
	});

	var slidder = null;
	var setMargin = () => {
		if (!slidder) {
			slidder = $('#view-slidder');
		}
		masterMap.setVerticalTopMargin(slidder.outerHeight());
	};

	$scope.$on('$destroy', () => angular.element($window).off('resize', setMargin));

	setMargin();
	angular.element($window).resize(setMargin);
});
