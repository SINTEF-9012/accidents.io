/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/leaflet/leaflet.d.ts" />
/// <reference path="./../../bower_components/a99d99f275e5c274a6ba/SuperSimpleCharts.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/marked/marked.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/lodash/lodash.d.ts" />

/// <reference path="./../references/generic.d.ts" />
/// <reference path="./../references/app.d.ts" />
/// <reference path="./../masterScope.d.ts" />

'use strict';

angular.module('mobileMasterApp')
.config((masterMapProvider: Master.MapConfig) => {
    masterMapProvider.setOptions({
            zoom: 13,
            center: new L.LatLng(59.911111, 10.752778),
            zoomControl: false,
            attributionControl: false,
            maxZoom: 20,
			minZoom: 2,
			keyboard: false,
			trackResize: false
        })
        .declareTileLayer({
            name: "MapBox",
            iconPath: "layer_mapbox.png",
			create: () => {
                return new L.TileLayer('https://{s}.tiles.mapbox.com/v4/apultier.609389ae/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYXB1bHRpZXIiLCJhIjoiWGJVRDYtYyJ9.4CJkS86ESYY2FoHdmw1kgQ', {
                    detectRetina: true,
					reuseTiles: true,
					maxZoom:20,
                    maxNativeZoom: 17
                });
            }
        })
        .declareTileLayer({
            name: "MapBoxBlue",
            iconPath: "layer_mapbox_blue.png",
            create: () => {
                return new L.TileLayer('https://{s}.tiles.mapbox.com/v3/apultier.g98dhngl/{z}/{x}/{y}.png', {
                    detectRetina: true,
					reuseTiles: true,
					maxZoom:20,
                    maxNativeZoom: 17
                });
            }
        })
        .declareTileLayer({
            name: "MapBox Grey",
            iconPath: "layer_mapbox_grey.png",
            create: () => {
                return new L.TileLayer('https://{s}.tiles.mapbox.com/v3/apultier.goh7k5a1/{z}/{x}/{y}.png', {
                    detectRetina: true,
					reuseTiles: true,
					maxZoom:20,
                    maxNativeZoom: 17
                });
            }
        })
        .declareTileLayer({
            name: "StatKart",
            iconPath: "layer_no_topo2.png",
            create: () => {
                return new L.TileLayer('http://opencache{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?' +
                    'layers=topo2&zoom={z}&x={x}&y={y}', {
                        subdomains: ['', '2', '3'],
                        detectRetina: true,
						reuseTiles: true,
						maxZoom:20,
                        maxNativeZoom: 18
                    });
            }
        })
        .declareTileLayer({
            name: "StatKart Graatone",
            iconPath: "layer_no_topo2_graatone.png",
            create: () => {
                return new L.TileLayer('http://opencache{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?' +
                    'layers=topo2graatone&zoom={z}&x={x}&y={y}', {
                        subdomains: ['', '2', '3'],
                        detectRetina: true,
						reuseTiles: true,
						maxZoom:20,
                        maxNativeZoom: 18
                    });
            }
        })
        .declareTileLayer({
            name: "StatKart sjo hovedkart",
            iconPath: "layer_no_hovedkart2.png",
            create: () => {
                return new L.TileLayer('http://opencache{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?' +
                    'layers=sjo_hovedkart2&zoom={z}&x={x}&y={y}', {
                        subdomains: ['', '2', '3'],
                        detectRetina: true,
						reuseTiles: true,
						maxZoom:20,
                        maxNativeZoom: 18
                    });
            }
        })
        .declareTileLayer({
            name: "StatKart gruunkart",
            iconPath: "layer_no_gruunkart.png",
            create: () => {
                return new L.TileLayer('http://opencache{s}.statkart.no/gatekeeper/gk/gk.open_gmaps?' +
                    'layers=norges_grunnkart&zoom={z}&x={x}&y={y}', {
                        subdomains: ['', '2', '3'],
                        detectRetina: true,
						reuseTiles: true,
						maxZoom:20,
                        maxNativeZoom: 18
                    });
            }
        })
        .declareTileLayer({
            name: "Watercolor",
            iconPath: "layer_stamen.png",
            create: () => {
                return new L.TileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg', {
                    subdomains: ['a', 'b', 'c', 'd'],
                    detectRetina: true,
					reuseTiles: true,
                    minZoom: 3,
					maxZoom:20,
                    maxNativeZoom: 16
                });
            }
        })
        .declareTileLayer({
            name: "Bing",
            iconPath: "layer_bing.png",
            create: () => {
                return new L.BingLayer("AnpoY7-quiG42t0EvUJb3RZkKTWCO0K0g4xA2jMTqr3KZ5cxZrEMULp1QFwctYG9", {
					detectRetina: true,
					reuseTiles: true,
					minZoom: 1,
                    maxNativeZoom: 18,
		            maxZoom:20
                });
            }
        })
        .declareTileLayer({
            name: "Satellite Mapbox",
            iconPath: "layer_mapbox_sat.png",
            create: () => {
				return new L.TileLayer('https://{s}.tiles.mapbox.com/v3/apultier.iehnl469/{z}/{x}/{y}.png', {
                    detectRetina: true,
					reuseTiles: true,
					maxZoom:20,
                    maxNativeZoom: 17
                });
            }
        })
		.setDefaultTileLayer("MapBox")
		.setContainer(document.getElementById("map-root"));

	marked.setOptions({
		gfm: true,
		tables: true,
		breaks: true
	});

})
.controller('MainCtrl', function(
	masterMap: Master.Map,
	$scope,
	$rootScope : MasterScope.Root,
	$window: ng.IWindowService,
	persistentMap: PersistentMap,
	authenticationService: AuthenticationService,
    itsa : ThingIdentifierService,
    thingModel: ThingModelService) {

	$scope.username = authenticationService.getUserName();
	$scope.changeUserName = () => {
		var newname = window.prompt("What is your name ? (A real authentication is coming)", $scope.username);
		if (newname) {
			$scope.username = newname;
			authenticationService.setUserName(newname);
		}
	};

	var jMap = $('#main-map'),
		jMapBody = jMap.children(),
		jlink = $('#main-map-link'),
		jMediablock = $('#main-mediablock'),
		jTimeline = $('#main-timeline');

	persistentMap.restorePersistentLayer(masterMap);
	persistentMap.unbindMasterMap(masterMap);

    masterMap.disableInteractions();
    masterMap.disableScale();

	var jwindow = $($window);

	var destroyed = false;

	var setLayout = throttle(() => {

		if (destroyed) {
			return;
		}

		var column = $('.responsive-infoblock-column'),
			blocs = column.children('.infoblock'),
			columnOffset = column.offset(),
			height = $window.innerHeight - (columnOffset ? columnOffset.top : 0) - 6,
			windowWidth = jwindow.width(),
			mediablockHeight = jMediablock.outerHeight();


		var mapHeight, blockHeight;

		// If it's a mobile or a tablet in portrait
		if (windowWidth <= 768) {
			mapHeight = 360;
			blockHeight = 180;
		} else {

			var lg = blocs.length / (windowWidth >= 1200 ? 3 : 2);

			blockHeight = Math.floor(height / Math.ceil(lg)) - 12;
			var width = blocs.first().innerWidth();
			if (blockHeight / width > 1.42) {
				blockHeight = Math.min(150, blockHeight);
			} 
			mapHeight = Math.max(Math.floor(height - mediablockHeight - 12), 270);
		}

		blocs.height(blockHeight);
		jMap.height(mapHeight);
		jTimeline.height(mediablockHeight - 12);

		window.setImmediate(() => {
			if (destroyed) {
				return;
			}
			jlink.height(mapHeight).width(jMap.width()).offset(jMap.offset());

			masterMap.moveTo(jMapBody);
			masterMap.showOverview();
		});
	}, 200);


	//var statsPatients: { [color: string]: number }, nbPatients = 0;
	//var patientsChart = new SuperSimpleCharts.BarChart(document.getElementById('patients-chart'));


	var checkObserver = (thing: ThingModel.Thing) => {
		if (thing.ID === 'master-summary') {
			computeSummary();
		}
	};

	var observer = {
		New: checkObserver, 
		Updated: checkObserver,
		Deleted: checkObserver,
		Define: () => {}
	};

	var computeSummary = () => {
		var summary = thingModel.warehouse.GetThing('master-summary');
		if (summary) {
			$scope.title = summary.GetString('title');
		} else {
			$scope.title = 'Untitled situation';
		}

		if (!$scope.$$phase) {
			$scope.$digest();
			setLayout();
		}
	};

	$rootScope.$on('thingmodel.open', () => {
		computeSummary();
	});

	computeSummary();
	thingModel.warehouse.RegisterObserver(observer);

	

	$scope.$on('$destroy', () => {
		destroyed = true;
		jwindow.off('resize', setLayout);
		thingModel.warehouse.UnregisterObserver(observer);
	});

	jwindow.resize(setLayout);

	// Update the panel height after the layout initialization
    window.setImmediate(() => {
		if (destroyed) {
			return;
		}
		setLayout();
		masterMap.setVerticalTopMargin(0);
		masterMap.moveTo(jMap.get(0));
		setLayout();
		masterMap.enableSituationOverview();
    });
});
