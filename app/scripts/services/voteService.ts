/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />

/// <reference path="./../references/generic.d.ts" />

'use strict';

angular.module('mobileMasterApp').service('voteService', function (
	notify: angularNotify,
	$http: ng.IHttpService) {

	var voteEndpoint = "http://localhost:5000/";

	// TODO
	var userKey = encodeURIComponent("canard");

	this.vote = (id: string, vote: string) => {
		if (databaseVotes) {
			databaseVotes[id] = vote;
		}
		var action = vote === "up" ? "upvote" : (vote === "down" ? "downvote" : "cancelvote");
		$http.get(voteEndpoint + encodeURIComponent(id) + "/"+userKey+"/" + action).error(() => {
			notify({ message: "Unable to vote", classes: "alert-error" });
		});
	};

	var databaseVotes: { [id: string]: string } = null;
	this.status = (id: string, callback: (vote: string) => void) => {
		if (databaseVotes) {
			callback(databaseVotes[id]);
			return;
		}

		$http.get(voteEndpoint + "votes/"+userKey).error(() => {
			notify({ message: "Unable to retrieve the votes", classes: "alert-error" });
		}).success((data) => {
			console.log(data);
			databaseVotes = <any>data;
			callback(data[id]);
		});
	};
});
 
