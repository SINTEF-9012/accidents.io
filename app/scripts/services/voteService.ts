/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />

/// <reference path="./../references/generic.d.ts" />

'use strict';

angular.module('mobileMasterApp').service('voteService', function (
	notify: angularNotify,
	UUID: UUIDService,
	$http: ng.IHttpService) {

	// TODO
	var voteEndpoint = "http://localhost:5000/";

	var userKey;
	var getKey = () => {
		if (userKey) return userKey;
		if (window.localStorage && window.localStorage.hasOwnProperty("utmostVoteId")) {
			userKey = window.localStorage.getItem("utmostVoteId");
		} else {
			userKey = UUID.generate();
			if (window.localStorage) {
				window.localStorage.setItem("utmostVoteId", userKey);
			}
		}

		return userKey = encodeURIComponent(userKey);
	}

	this.vote = (id: string, vote: string) => {
		if (databaseVotes) {
			databaseVotes[id] = vote;
		}
		var action = vote === "up" ? "upvote" : (vote === "down" ? "downvote" : "cancelvote");
		$http.get(voteEndpoint + encodeURIComponent(id) + "/"+getKey()+"/" + action).error(() => {
			notify({ message: "Unable to vote", classes: "alert-error" });
		});
	};

	var databaseVotes: { [id: string]: string } = null;
	this.status = (id: string, callback: (vote: string) => void) => {
		if (databaseVotes) {
			callback(databaseVotes[id]);
			return;
		}

		$http.get(voteEndpoint + "votes/"+getKey()).error(() => {
			notify({ message: "Unable to retrieve the votes", classes: "alert-error" });
		}).success((data) => {
			console.log(data);
			databaseVotes = <any>data;
			callback(data[id]);
		});
	};
});
 
