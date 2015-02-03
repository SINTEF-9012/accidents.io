/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-ui/angular-ui-router.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/leaflet/leaflet.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/lodash/lodash.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/moment/moment.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/jquery/jquery.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/googlemaps/google.maps.d.ts" />

/// <reference path="./../references/generic.d.ts" />
/// <reference path="./../references/app.d.ts" />
/// <reference path="./../masterScope.d.ts" />

'use strict';

angular.module('mobileMasterApp').controller('ThingCtrl', (
	$state: ng.ui.IStateService,
	$scope: any,
	$stateParams: any,
	cfpLoadingBar: any,
	Fullscreen: any,
	$rootScope: MasterScope.Root,
    persistentMap : PersistentMap,
	settingsService: SettingsService,
	itsa: ThingIdentifierService,
	masterMap: Master.Map,
	$window: ng.IWindowService,
	Knowledge : KnowledgeService,
	thingModel: ThingModelService,
	colorFromImage: ColorFromImageService,
	notify: angularNotify,
	rrdService: RrdService,
	voteService: VoteService,
	streetViewService: StreetViewService
	) => {

	masterMap.disableSituationOverview();
	persistentMap.restorePersistentLayer(masterMap);
	persistentMap.unbindMasterMap(masterMap);


	var multimediaServer = settingsService.getMediaServerUrl();

	var id = $stateParams.ID;
	var isPatient = $state.is('patient'),
		stateBack = 'map.slidder',
		stateInfos = { thingtype: 'all' },
		isMedia = false;

	$scope.from = $stateParams.from;
	$scope.id = id;

	if ($stateParams.from === 'map') {
		stateBack = 'map.slidder';
	}
	else if ($stateParams.from === 'multimedias') {
		stateBack = 'multimedias';
	}

	var jwindow = $($window), jMap : JQuery = $('#thing-map'), jView = $('#thing-view');

	var jInteractionMask: JQuery = $('#interactions-mask');
	if ((<any>window).utmostMapInteractions) {
		jInteractionMask.hide();
	} else {
		jInteractionMask.dblclick(() => {
			jInteractionMask.hide();
			notify({ message: "Map interactions enabled", classes: "alert-info" });
			(<any>window).utmostMapInteractions = true;
		}).click(() => {
			jInteractionMask.addClass("clicked").removeClass("clicked-anim");
			window.setTimeout(() => {
				jInteractionMask.removeClass("clicked").addClass("clicked-anim");
			}, 10);
		});
	};

	var panorama: google.maps.StreetViewPanorama = null;
	var panoramaService = new google.maps.StreetViewService;
	var oldStPosition = new google.maps.LatLng(0, 0);
	var setStreetView = _.throttle((googleLatLng: google.maps.LatLng) => {
		if (googleLatLng.equals(oldStPosition)) return;
		oldStPosition = googleLatLng;
		var photoGraphPosition = google.maps.geometry.spherical.computeOffset(googleLatLng, 10, 0);
		panoramaService.getPanoramaByLocation(photoGraphPosition, 42, (panoData) => {
			if (panoData == null) {
				$scope.hasStreetview = false;
				return;
			}

			$scope.hasStreetview = true;
			$scope.$digest();
			setLayout();
			digestScope();
			if (panorama === null) {
				panorama = streetViewService.create(document.getElementById("streetview-thing"));
			}
			panorama.setPosition(photoGraphPosition);


			var panoCenter = panoData.location.latLng;
			var heading = google.maps.geometry.spherical.computeHeading(panoCenter, googleLatLng);
			var pov = panorama.getPov();
			pov.heading = heading;
			pov.pitch = -10;
			panorama.setPov(pov);
			/*var marker = new google.maps.Marker({
				map: panorama,
				position: googleLatLng
			});*/
		});
	}, 5000);

	var deleteTimer = 0;
	$scope.startDeleteTimer = () => {
		$scope.deleteTimerRunning = true;
		$scope.delay = 5;
		$scope.hideToolbarButtons = true;

		deleteTimer = window.setInterval(() => {
			if (--$scope.delay === 0) {
				thingModel.RemoveThing(id);
				$state.go(stateBack, stateInfos);
				notify({message: id +" deleted", classes: "alert-danger"});
				deleteTimer = 0;
			} else {
				$scope.$digest();
			};
		}, 1000);
	};

	$scope.cancelDeleteTimer = () => {
		window.clearInterval(deleteTimer);
		deleteTimer = 0;
		$scope.deleteTimerRunning = false;
		$scope.hideToolbarButtons = false;
	};

	var returnLink = $scope.returnLink = $state.href(stateBack, stateInfos);
	$scope.hideToolbarButtons = false;

	$scope.thing = {};
	$scope.unfound = true;
	$scope.hideMap = false;

	var oldPosition: L.LatLng = null,
		oldZoom = 18,
		oldTime: number,
		oldBounds: L.LatLngBounds = null,
		thingSpeed = 0.0,
		lastDragTime = 0;

	var onDrag = () => {
		lastDragTime = +new Date();
	};
	masterMap.on('dragstart', onDrag);

	var graphOptionsTemperature = {
		labels: ["", "Temperature"],
		colors: ["white"],
		highlightCircleSize: 5,
		animatedZooms: true,
		//showRangeSelector: true,
		//showRoller: true,
		fillGraph: true,
		customBars: false,
		fillAlpha: 0.15,
		gridLineColor: "rgba(220,220,220,0.3)",
		strokeWidth: 3.0,
		axisLineColor: "rgba(220,220,220,0.3)",
		axisLabelColor: "white",
		//rollPeriod: 2,
		//plotter: smoothPlotter,
		labelsDivWidth: 260,
		labelsDivStyles: {
			background: "transparent",
			fontSize: "12px",
			fontFamily: "monospace",
			textAlign: "right"
		},
		axes: {
			y: {
				axisLabelWidth: 30
			}
		}
	};
	var graphOptionsActivity = _.cloneDeep(graphOptionsTemperature);
	graphOptionsActivity.labels[1] = "Activity";
	graphOptionsActivity.customBars = true;
	graphOptionsActivity.fillGraph = false;
	graphOptionsActivity.fillAlpha = 0.42;

	var graphTemperature = null, graphActivity = null;
	var divGraphTemperature = null, divGraphActivity = null;

	var digestScope = throttle(() => {
		var thing = thingModel.warehouse.GetThing(id);

		if (thing) {

			$scope.unfound = false;

			thingModel.ApplyThingToScope($scope.thing, thing);

			var location = thing.LocationLatLng();

			if (!location || isNaN(location.Latitude) || isNaN(location.Longitude)) {
				$scope.hideMap = true;
			} else {

				$scope.hideMap = false;

				masterMap.setSelectedThing(id, location.Latitude, location.Longitude);

				var pos = new L.LatLng(location.Latitude, location.Longitude),
					now = +new Date();

				if (oldPosition !== null) {
					// The speed is in km/h because it's easier for me
					thingSpeed = thingSpeed * 0.75 + (pos.distanceTo(oldPosition) / (now - oldTime)) * 1000 * 0.25 * 3.6;
				}

				var zoom: number = L.Browser.retina ? 17.0 : 18.0;

				if (thingSpeed > 95.0) {
					zoom = 16;
				} else if (thingSpeed > 80.0 && oldZoom === 16.0) {
					zoom = 16;
				} else if (thingSpeed > 18.0) {
					zoom = 17;
				} else if (thingSpeed > 15.0 && oldZoom === 17.0) {
					zoom = 17;
				} else if (thingSpeed < 1.0) {
					zoom = Math.max(masterMap.getZoom(), zoom);
				}


				/*var centerPoint = masterMap.project(pos, zoom),
					size = masterMap.getSize().divideBy(2),
					viewBounds = new L.Bounds(centerPoint.subtract(size), centerPoint.add(size)),
					viewLatLngBounds = new L.LatLngBounds(
						masterMap.unproject(viewBounds.min, zoom),
						masterMap.unproject(viewBounds.max, zoom));

				masterMap.setMaxBounds(viewLatLngBounds);*/

				var mapBounds = masterMap.getBounds();

				var changeView = false, initSetView = false;
				// First update after opening the view (when selecting another thing for example)
				if (oldPosition === null && (!mapBounds.pad(-0.2).contains(pos) || Math.abs(masterMap.getZoom() - zoom) > 2)){
					changeView = true;
					initSetView = true;
				// If only the zoom level should be updated, or the element is to close to the border of the map
				} else if (mapBounds.contains(pos)) {
					if (masterMap.getZoom() > zoom || !mapBounds.pad(-0.2).contains(pos)) {
						changeView = true;
					}
				} else {
					changeView = true;
				}

				if (now - lastDragTime < 4200) {
					changeView = false;
				}

				if (changeView) {
					//if (trueinitSetView/* || !$('html').hasClass('disable-markers-animations')*/) {

						var options = oldPosition === null ? { animate: false } : undefined;

					masterMap.setView(pos, zoom, options);

					var asynchronousRah = () => {
						if (oldPosition === pos && oldZoom === zoom && !masterMap.getCenter().equals(pos)) {
							masterMap.setView(pos, zoom, {animate: false});
						}
					};

					masterMap.on('moveend', asynchronousRah);

					window.setTimeout(() => {
						masterMap.off('moveend', asynchronousRah);
					}, 500);

					//}
				}

				oldPosition = pos;
				oldTime = now;
				oldZoom = zoom;
				oldBounds = mapBounds;

				// canard
				var googleLatLng = new google.maps.LatLng(location.Latitude, location.Longitude);
				setStreetView(googleLatLng);
			}


			var type = itsa.typefrom(thing);
			if ($stateParams.from && $stateParams.from.indexOf('list-') === 0) {
				stateInfos = { from: $stateParams.from.slice(5), thingtype: type };
			} else {
				stateInfos = { thingtype: type };
			}

			returnLink = $scope.returnLink = $state.href(stateBack, stateInfos);

			$scope.canOrder = Knowledge.canOrder(thing);
			$scope.canEdit = Knowledge.canEdit(thing);
			$scope.canDelete = Knowledge.canDelete(thing);

			var url = $scope.thing.url;
			if (!url) {
				if (thing.Type && thing.Type.Name.indexOf("aftenposten") !== -1 && thing.HasProperty("bilde")) {
					url = thing.String('bilde');
					if (url) {
						url = "http://mm.aftenposten.no/2014/09/04-sykkel/data/images/600_" + url;
					}
				//} else if (thing.HasProperty("streetview")) {
				//	url = thing.String('streetview');
				}
			}

			isMedia = url != null;

			if (isMedia) {

				$scope.isVideo = /video/i.test(thing.Type.Name);
				$scope.isPicture = !$scope.isVideo;

				var smallThumbnailUrl = multimediaServer + '/thumbnail/' + url;

				if ($scope.isVideo) {
					$scope.mp4Url = multimediaServer + '/convert/mp4/480/' + url;
					$scope.webmUrl = multimediaServer + '/convert/webm/480/' + url;
					$scope.posterUrl = smallThumbnailUrl;
				}

				if ($scope.isPicture) {
					var width = jwindow.width();

					var size = '/';
					if (width <= 640) {
						size = '/resize/640/480/';
					} else if (width <= 1280) {
						size = '/resize/1280/720/';
					} else if (width <= 1920) {
						size = '/resize/1920/1080/';
					}

					$scope.fullUrl = multimediaServer + size + url;
					$scope.thumbnailUrl = multimediaServer + '/resize/640/480/' + url;

					$scope.showPicture = () => {
						$scope.fullscreenPicture = true;

						window.setImmediate(() => {
							cfpLoadingBar.start();

							(<any>$('#picture-view')).imagesLoaded(() => {
								cfpLoadingBar.complete();
							});

						});
					}

					Fullscreen.$on('FBFullscreen.change', (e, isEnabled) => {
						if (!isEnabled) {
							$scope.fullscreenPicture = false;
						}
					});

				}

				window.setImmediate(() => {
					colorFromImage.applyColor(smallThumbnailUrl, setTilesColors);
				});
			}

			$scope.knowledge = thing.Type ? Knowledge.getPropertiesOrder(thing) : [];


			// The name information is already in the page title
			$scope.rawKnowledge = $scope.knowledge;
			$scope.knowledge = _.filter($scope.knowledge, (k: any) => k.score >= 0 /*&& k.key !== 'name'*/);

			if (isPatient) {
				$scope.oldReport = $scope.thing && $scope.thing.braceletOn && $scope.thing.reportDate && (moment().subtract("minutes", 3).isAfter($scope.thing.reportDate));

				rrdService.load(id, "temperature", (data) => {
					if (data.length) {
						if (graphTemperature === null) {
							divGraphTemperature = document.createElement("div");

							var canvasArea = document.getElementById("canvas-temperature-area");
							if (canvasArea) {
								canvasArea.appendChild(divGraphTemperature);
							}

							graphTemperature = new Dygraph(divGraphTemperature, data, graphOptionsTemperature);
						} else {
							graphTemperature.updateOptions({ 'file': data });
						}
					}
				});

				rrdService.load(id, "activity", (data) => {
					if (data.length) {
						if (graphActivity === null) {
							divGraphActivity = document.createElement("div");

							var canvasArea = document.getElementById("canvas-activity-area");
							if (canvasArea) {
								canvasArea.appendChild(divGraphActivity);
							}

							graphActivity = new Dygraph(divGraphActivity, data, graphOptionsActivity);
						} else {
							graphActivity.updateOptions({ 'file': data });
						}
					}
				}, { min: "_activityMin", max: "_activityMax" });
			}


			if (!$scope.$$phase) {
				$scope.$digest();
				setLayout();
			} else {
				window.setImmediate(() => setLayout());
			}
		}
	}, 10);

	var destroyed = false;

	var tileColor = null;


	var setLayout = throttle(() => {
		if (destroyed) {
			return;
		}
		if ($scope.hideMap) {
			masterMap.hide();
		} else {
			masterMap.moveTo(jMap);
		}
		setTilesColors(tileColor);

		return;
		var width = jwindow.width();


		var windowHeight = jwindow.height();
		var height = Math.max(Math.floor(windowHeight - jMap.offset().top), 300);
		jMap.height(height - 1 /* border */);
		if (width >= 768 && !$scope.hideMap) {
			jView.height(height - 11 /* margin bottom */);
		} else {
			jMap.height(Math.min(height - 1, Math.floor(windowHeight/2)) /* border */);
			jView.height('auto');
		}

		if (isPatient) {
			if (graphTemperature) {
				var canvasArea = document.getElementById("canvas-temperature-area");
				if (canvasArea) {
					canvasArea.appendChild(divGraphTemperature);
					graphTemperature.resize();
				}
			}

			if (graphActivity) {
				var canvasAreaAct = document.getElementById("canvas-activity-area");
				if (canvasAreaAct) {
					canvasAreaAct.appendChild(divGraphActivity);
					graphActivity.resize();
				}
			}
		}




	}, 50);

	setLayout();
	// ??? masterMap.moveTo(jMap);

	digestScope();

	var observer = {
		New: (thing: ThingModel.Thing) => {
			if (thing.ID === id) {
				digestScope();
			} 
		},
		Updated: (thing: ThingModel.Thing) => {
			if (thing.ID === id) {
				digestScope();
			} 
		},
		Deleted: (thing: ThingModel.Thing) => {
			if (thing.ID === id) {
				$scope.unfound = true;
				digestScope();
			} 
		},
		Define: () => {}
	};
	thingModel.warehouse.RegisterObserver(observer);


	masterMap.closePopup();
	masterMap.enableInteractions();
	masterMap.enableScale();
	masterMap.filterThing(id);


	var disableStateChangeSuccessCallback =
	$rootScope.$on('$stateChangeSuccess', () => {
		$scope.returnLink = returnLink;
		$scope.hideToolbarButtons = false;
		masterMap.filterThing(id);

		if ($scope.thing.location) {
			masterMap.setSelectedThing(id, $scope.thing.location.Latitude, $scope.thing.location.Longitude);
		}

		if (!$scope.$$phase) {
			$scope.$digest();
		}

		window.setImmediate(() => setTilesColors(tileColor));
		});

	$scope.$watch("thing.description",() => {
		$scope.htmlDescription = $scope.thing.description ? marked($scope.thing.description)
			.replace(/<table>/g, '<table class="table table-striped">') : '';
	});

	$scope.$on('$destroy', () => {
		destroyed = true;
		jwindow.off('resize', setLayout);
		thingModel.warehouse.UnregisterObserver(observer);
		disableStateChangeSuccessCallback();

		if (deleteTimer !== 0) {
			window.clearInterval(deleteTimer);
			thingModel.RemoveThing(id);
		}

		masterMap.off('drag', onDrag);

		if (graphTemperature !== null) {
			graphTemperature.destroy();
		}
		if (graphActivity != null) {
			graphActivity.destroy();
		}
	});

	jwindow.resize(setLayout);

	masterMap.setVerticalTopMargin(0);
	setLayout();

	function setTilesColors(color) {
		// TODO
		if (!color || $scope.unfound) return;
		tileColor = color;
		var match = color.match(/rgb\((\d+),(\d+),(\d+)\)/),
			r = parseInt(match[1]),
			g = parseInt(match[2]),
			b = parseInt(match[3]);

		var sat = isPatient ? 0.32 : 0.66;
		var gray = r * 0.3086 + g * 0.6094 + b * 0.0820;

		r = Math.round(r * sat + gray * (1 - sat));
		g = Math.round(g * sat + gray * (1 - sat));
		b = Math.round(b * sat + gray * (1 - sat));
		color = "rgb(" + r + "," + g + "," + b + ")";
		//var borderColor = "rgb(" + Math.round(r*0.85) + "," + Math.round(g*0.85) + "," + Math.round(b*0.85) + ")";

		$('#utmost-picture').css({
			background: color
		});
		/*$('.patientInfobox, .thingInfobox, .navbar-fixed-top').css({
			'backgroundColor': color,
			'color': colorFromImage.whiteOrBlack(color),
			'borderColor':  borderColor
		});*/
	}

	// ReSharper disable once ExpressionIsAlwaysConst
	/*if (!isMedia) {
		var imgIdenticon = $('img.identicon');

		if (colorFromImage.hasCache(imgIdenticon.get(0))) {
							console.log(prop.Key[0]);
			colorFromImage.applyColor(imgIdenticon.get(0), setTilesColors, true);
		} else {
			(<any>imgIdenticon).imagesLoaded(() => {
				// Double verification because it's asynchronous
				if (!isMedia) {
					colorFromImage.applyColor(imgIdenticon.get(0), setTilesColors, true);
				}
			});
		}
	}*/

	voteService.status(id,(vote) => {
		if (vote === "up") {
			$scope.upvoted = true;
		} else if (vote === "down") {
			$scope.downvoted = true;
		}
	});

	$scope.upvote = () => {
		$scope.upvoted = !$scope.upvoted;
		$scope.downvoted = false;
		voteService.vote(id, $scope.upvoted ? "up" : "none");
	};

	$scope.downvote = () => {
		$scope.downvoted = !$scope.downvoted;
		$scope.upvoted = false;
		voteService.vote(id, $scope.downvoted ? "down" : "none");
	};
}); 
