/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/angular-ui/angular-ui-router.d.ts" />
/// <reference path="./../../bower_components/DefinitelyTyped/lodash/lodash.d.ts" />
/// <reference path="../../bower_components/ThingModel/TypeScript/build/ThingModel.d.ts" />

/// <reference path="./../references/generic.d.ts" />
/// <reference path="./../references/app.d.ts" />

'use strict';

(<any>angular.module("mobileMasterApp")).provider("thingModel", function () {
	this.$get = (
		$rootScope: MasterScope.Root,
		Knowledge: KnowledgeService,
		$state: ng.ui.IStateService,
		settingsService: SettingsService) => {
		this.warehouse = new ThingModel.Warehouse();

		/*window.onbeforeunload = () => {
			try {
				var serializer = new ThingModel.Proto.ToProtobuf();
				var transaction = serializer.Convert(this.warehouse.Things, [], this.warehouse.ThingsTypes, "offline save");
				window.localStorage.setItem("ThingModelWarehouseOfflineSave", transaction.toBase64());
			} catch (e) {}
		}*/

		var clientID = settingsService.getClientName() + " - " + navigator.userAgent;
		var endPoint = settingsService.getThingModelUrl();

		$rootScope.thingmodel = {
			loading: true,
			connected: false,
			nbTransactions: 0,
			lastSenderName: null,
			nbSend: 0
		};

		var applyScope = throttle(() => {
			if (!$rootScope.$$phase) {
				$rootScope.$digest();
			}
		}, 50);

		try {
			this.client = new ThingModel.WebSockets.Client(clientID, endPoint, this.warehouse);
		} catch (e) {
			alert("ThingModel error: " + e.message);
			$state.go('settings');
			return this;
		} 

		this.client.RegisterObserver({
			OnFirstOpen: () => {
				$rootScope.thingmodel.loading = false;
				$rootScope.$emit('thingmodel.firstopen');
			},
			OnOpen: () => {
				$rootScope.thingmodel.connected = true;
				$rootScope.thingmodel.loading = false;
				$rootScope.$emit('thingmodel.open');
				applyScope();
			},
			OnClose: () => {
				$rootScope.thingmodel.connected = false;
				applyScope();
				$rootScope.$emit('thingmodel.close');
			},
			OnTransaction: (senderName: string) => {
				++$rootScope.thingmodel.nbTransactions;
				$rootScope.thingmodel.lastSenderName = senderName;
				applyScope();
				$rootScope.$emit('thingmodel.transaction');
			},
			OnSend: () => {
				++$rootScope.thingmodel.nbSend;
				applyScope();
				$rootScope.$emit('thingmodel.send');
			}
		});

		this.RemoveThing = (id: string, send: boolean = true)=> {
			var thing = this.warehouse.GetThing(id);
			this.warehouse.RemoveThing(thing);
			if (send) {
				this.client.Send();
			}
		};

		this.ApplyThingToScope = ($scope: any, thing: ThingModel.Thing) => {

			if (!$scope || !thing) {
				return;
			}

			var name: string;

			if (!(name = thing.String('name'))) {
				if (!(name = thing.String('title'))) {
					if (!(name = thing.String('description'))) {
						if (!(name = thing.String('message'))) {
							name = undefined;
						}
					}
				}
			}

			$scope.ID = thing.ID;
			$scope.type = thing.Type ? thing.Type.Name : undefined;

			_.each(thing.Properties, (property: ThingModel.Property) => {
				$scope[property.Key] = (<any>property).Value;
			});

			$scope.name = name;
		};

		this.EditThing = (id: string, values: { [property: string]: { value: string; type: string } }) => {
			var thing = this.warehouse.GetThing(id);
			if (!thing) {
				return;
			}

			_.each(values, (value: {value:any;type:string}, property: string)=> {
				var prop;	
				switch (value.type.toLowerCase()) {
					case 'localization':
						if (value.value.type === 'latlng') {
							prop = new ThingModel.Property.Location.LatLng(property, value.value);
							break;
						}
						if (value.value.type === 'point') {
							prop = new ThingModel.Property.Location.Point(property, value.value);
							break;
						}
						if (value.value.type === 'equatorial') {
							prop = new ThingModel.Property.Location.Equatorial(property, value.value);
							break;
						}
						throw "Not implemented";
					case 'number':
					case 'double':
						prop = new ThingModel.Property.Double(property, parseFloat(value.value));
						break;
					case 'int':
						prop = new ThingModel.Property.Int(property, parseInt(value.value));
						break;
					case 'datetime':
						prop = new ThingModel.Property.DateTime(property, new Date(value.value));
						break;
					case 'boolean':
						prop = new ThingModel.Property.Boolean(property, !/^(false|0|no)$/i.test(value.value));
						break;
					default :
					case 'string':
						prop = new ThingModel.Property.String(property, value.value);
						break;
				}
				thing.SetProperty(prop);
			});

			this.warehouse.NotifyThingUpdate(thing);
			this.client.Send();
		};

		return this;
	};
});
