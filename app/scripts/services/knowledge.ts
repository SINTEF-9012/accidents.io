'use strict';

angular.module('mobileMasterApp').provider('Knowledge', function () {

	var knowledge = [
		{
			typeName: "", // default
			tablePropertiesOrder: { name : 10, location: -1} /*,
			icon: (thing)=> {
				return L.marker();
			}*/
		},
		{
			typeName: "vehicle",
			tablePropertiesOrder: { speed: 5 }
		}
	];

	this.addKnowledge = (k: Knowledge) => {
		knowledge.push(k);
	};

	this.$get = (itsa: ThingIdentifierService)=> {
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
					itsa.response(thing) ||
					itsa.risk(thing);
			},
			getPropertiesOrder: _.memoize((thingType: ThingModel.ThingType) => {
				var scores = {};
				_.each(knowledge, (k: Knowledge) => {
					if (thingType.Name.match(k.typeName)) {
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

					if (score >= 0) {
						var scopeProp: any = {
							key: prop.Key,
							required: prop.Required,
							type: ThingModel.Type[prop.Type],
							score: score + (prop.Required ? 1 : 0)
						};

						// TODO identify undefined source and fixe it
						if (prop.Name !== "undefined") {
							scopeProp.name = prop.Name;
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
