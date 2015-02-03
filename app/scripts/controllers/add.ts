/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-ui/angular-ui-router.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-hotkeys/angular-hotkeys.d.ts" />
/// <reference path="../../bower_components/ThingModel/TypeScript/build/ThingModel.d.ts" />

/// <reference path="./../references/app.d.ts" />
/// <reference path="./../references/generic.d.ts" />
/// <reference path="./../masterScope.d.ts" />

'use strict';

angular.module('mobileMasterApp').controller('AddCtrl', (
	$scope,
	$rootScope : MasterScope.Root,
	$state: ng.ui.IStateService,
	$stateParams,
    $compile : ng.ICompileService,
	masterMap: Master.Map,
	AddService: AddService,
	hotkeys: ng.hotkeys.HotkeysProvider,
	$window: ng.IWindowService,
	persistentMap: PersistentMap,
	voteService: VoteService,
	notify: angularNotify,
	UUID: UUIDService
	) => {

	if ($rootScope.pastSituation) {
		notify({message: "Live mode is required for adding new elements.", classes: "alert-warning"});
		$state.go("main");
		return;
	}

	var position: L.LatLng;

	// The location can be specified as state parameters
	if ($stateParams.lat && $stateParams.lng) {
		position = L.latLng($stateParams.lat, $stateParams.lng);
	} else {
		position = masterMap.getCenter();
	}


	$scope.types = {
		"none": {
			items: {
				"risk": "Risk",
				"almost": "Near miss",
				"green": "Small accident",
				"orange": "Accident",
				"red": "Critical accident"
			}
		},
		"bike": {
			items: {
				"risk": "Bike risk",
				"almost": "Bike near miss",
				"green": "Bike small accident",
				"orange": "Bike accident",
				"red": "Bike critical accident"
			}
		},
		"boat": {
			items: {
				"risk": "Boat risk",
				"almost": "Boat near miss",
				"green": "Boat small accident",
				"orange": "Boat accident",
				"red": "Boat critical accident"
			}
		},
		"car": {
			items: {
				"risk": "Car risk",
				"almost": "Car near miss",
				"green": "Car small accident",
				"orange": "Car accident",
				"red": "Car critical accident"
			}
		},
		"moto": {
			items: {
				"risk": "Motorcycle risk",
				"almost": "Motorcycle near miss",
				"green": "Motorcycle small accident",
				"orange": "Motorcycle accident",
				"red": "Motorcycle critical accident"
			}
		},
		"pedestrian": {
			items: {
				"risk": "Risk for pedestrians",
				"almost": "Pedestrian near miss",
				"green": "Pedestrian small accident",
				"orange": "Pedestrian accident",
				"red": "Pedestrian critical accident"
			}
		},
		"ski": {
			items: {
				"risk": "Risk for skiers",
				"almost": "Ski near miss",
				"green": "Ski small accident",
				"orange": "Ski accident",
				"red": "Ski critical accident"
			}
		},
		"snowmobile": {
			items: {
				"risk": "Snowmobile risk",
				"almost": "Snowmobile near miss",
				"green": "Snowmobile small accident",
				"orange": "Snowmobile accident",
				"red": "Snowmobile critical accident"
			}
		}
		
	};

	var iconContainer = L.DomUtil.create('div', 'utmost-icon'),
		jIconContainer = $(iconContainer);

	var updateIcon = () => {
		var img = $("<img>");
		var icon;
		if ($rootScope.add.category === "none") {
			icon = $rootScope.add.type + "-small";
		} else {
			icon = $rootScope.add.type + "-" + $rootScope.add.category + "-smaa";
		}
		img.attr('src', '/images/utmost/' + icon + '.png');
		jIconContainer.empty().append(img);
	};

	$scope.activate = (category: string, type: string) => {
		$rootScope.add = {
			category: category,
			type: type
		};

		if (window.localStorage) {
			window.localStorage.setItem('addCategory', category);
			window.localStorage.setItem('addType', type);
		}

		updateIcon();
	};

	if (!$rootScope.add) {
		if (window.localStorage) {
			$scope.activate(window.localStorage.getItem('addCategory') || 'none',
				window.localStorage.getItem('addType') || 'risk');
		} else {
			$scope.activate('none', 'risk');
		}
	} else {
		updateIcon();
	}

	//marker.addTo(masterMap);

	$scope.save = (goToMainAfter: boolean) => {

		if (!$scope.description) {
			notify({message: "Please fill a description", classes: "alert-danger"});
			return;
		}
		var icon;
		if ($rootScope.add.category === "none") {
			icon = $rootScope.add.type;
		} else {
			icon = $rootScope.add.type + "-" + $rootScope.add.category;
		}
		var id = UUID.generate();
		var type = "master:utmost:" + $rootScope.add.type;
		var center = masterMap.getCenter();
		AddService.register(type, center, (thing: ThingModel.ThingPropertyBuilder) => {
			if ($scope.description) {
				thing.String('description', $scope.description);
			}
			thing.DateTime("publication", new Date());
			//thing.String('name', $scope.types[$rootScope.add.category].items[$rootScope.add.type]);
			thing.String('_utmostIcon', icon);
		}, id);

		var message = $scope.types[$rootScope.add.category].items[$rootScope.add.type] + " saved";
		notify({message: message, classes: "alert-info"});
		
		if (goToMainAfter) {
			voteService.vote(id, "up");
			if ($rootScope.previousState && $rootScope.previousState.indexOf('add') !== 0) {
				if ($rootScope.previousState === 'streetview') {
					$state.go('streetview', {
						lat: center.lat,
						lng: center.lng
					});
				} else {
					$state.go($rootScope.previousState);
				}
			} else {
				$state.go('map.slidder');
			}
		}
	};

	var removeListener = $rootScope.$on('$stateChangeStart', (event: ng.IAngularEvent, toState: any) => {
		if (toState.name === "main.add") {
			$scope.save(false);
		}
		//masterMap.removeLayer(marker);
		removeListener();
	});

	masterMap.closePopup();
	masterMap.enableInteractions();
	masterMap.enableScale();

	var jwindow = $($window), jMap = $('#thing-map'), jView = $('#thing-view');
	var destroyed = false;

	var setLayout = throttle(() => {
		if (destroyed) {
			return;
		}

		var width = jwindow.width();
		var height = Math.max(Math.floor(jwindow.height() - jMap.offset().top), 300);
		jMap.height(height - 1 /* border */);

		if (width >= 768 && !$scope.hideMap) {
			jView.height(height - 11 /* margin bottom */);
		} else {
			jView.height('auto');
		}

		masterMap.moveTo(jMap);
	}, 50);

	jwindow.resize(setLayout);
	var delayedClick = () => {
		var interval = window.setInterval(() => {
			masterMap.moveTo(jMap, true);
		}, 33);
		window.setTimeout(() => {
			masterMap.moveTo(jMap, true);
			setLayout();
			window.clearInterval(interval);
		}, 300);
	};
	jView.on('click', delayedClick);

	$scope.$on('$destroy', () => {
		destroyed = true;
		jwindow.off('resize', setLayout);
		jView.off('click', delayedClick);
		masterMap.disableShadow();
		//thingModel.warehouse.UnregisterObserver(observer);
	});


	//persistentMap.unbindMasterMap(masterMap);
	masterMap.setVerticalTopMargin(0);
	masterMap.disableSituationOverview();
	setLayout();
	persistentMap.bindMasterMap(masterMap);

	window.setImmediate(() => {
		persistentMap.restorePersistentLayer(masterMap);
		masterMap.panTo(position);
		masterMap.enableShadow(undefined, iconContainer, 'flex');
	});

	setLayout();

	hotkeys.bindTo($scope)
		.add({
			combo: 'return',
			description: 'Save',
			callback: () => $scope.save()
	});
});
