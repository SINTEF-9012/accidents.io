'use strict';

angular.module('mobileMasterApp').provider('Knowledge', function () {

	var knowledge = [
		{
			typeName: null, // default
			tablePropertiesOrder: { name : 10, location: -5}
		},
		{
			typeName: "tweets",
			tablePropertiesOrder: {
				description: 5,
				tags: 3,
				available: 2
			}	
		},
		{
			typeName: "resources",
			tablePropertiesOrder: { speed: 5 }
		},
		{
			typeName: "medias",
			tablePropertiesOrder: {url: -1}
		}
	];

	this.addKnowledge = (k: Knowledge) => {
		knowledge.push(k);
	};

	this.$get = (itsa: ThingIdentifierService) => {

		_.each(knowledge, (k: Knowledge) => {
			if (k.typeName) {
				k.typeTest = itsa.testfor(k.typeName);
			} else {
				k.typeTest = /^/;
			}
		});

		return {
			canOrder: (thing: ThingModel.Thing) => {
				if (!itsa.resource(thing)) {
					return false;
				}

				var status = thing.String("status");
				return !status || status === "Unassigned";
			},
			canEdit: (thing: ThingModel.Thing) => {
				return itsa.incident(thing) ||
					itsa.multimedia(thing) ||
					itsa.order(thing) ||
					itsa.response(thing) ||
					itsa.risk(thing);
			},
			canDelete: (thing: ThingModel.Thing) => {
				return itsa.multimedia(thing) ||
					itsa.order(thing) ||
					itsa.incident(thing) ||
					itsa.response(thing) ||
					itsa.risk(thing);
			},
			getPropertiesOrder: _.memoize((thingType: ThingModel.ThingType) => {
				var scores = {};
				_.each(knowledge, (k: Knowledge) => {
					if (k.typeTest.test(thingType.Name)) {
						_.each(k.tablePropertiesOrder, (score, key) => {
							if (scores.hasOwnProperty(key)) {
								scores[key] += score;
							} else {
								scores[key] = score;
							}
						});
					}
				});

				var list = [];

				_.each(thingType.Properties, (prop: ThingModel.PropertyType) => {
					var score = scores[prop.Key] || 0;

					if (prop.Key !== "undefined") {
						var scopeProp: any = {
							key: prop.Key,
							required: prop.Required,
							type: ThingModel.Type[prop.Type],
							score: score + (prop.Required ? 1 : 0)
						};

						// TODO identify undefined source and fixe it
						if (prop.Name !== "undefined") {
							scopeProp.name = prop.Name;
						} else {
							scopeProp.name = prop.Key.charAt(0).toUpperCase() + prop.Key.slice(1);
						}

						if (prop.Description !== "undefined") {
							scopeProp.description = prop.Description;
						}


						list.push(scopeProp);
					}
				});
				list.sort((a, b) => {
					var scorea = a.score,
						scoreb = b.score;
					return scorea === scoreb ? a.key.localeCompare(b.key) : scoreb - scorea;
				});

				return list;
			}, (thingType: ThingModel.ThingType) => thingType.Name)
		}
	};
});
