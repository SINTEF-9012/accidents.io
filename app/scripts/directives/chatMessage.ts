/// <reference path="./../../bower_components/DefinitelyTyped/angularjs/angular.d.ts" />

/// <reference path="./../references/app.d.ts" />

'use strict';

angular.module('mobileMasterApp')
  .directive('chatMessage', (authenticationService: AuthenticationService) => {
    return {
        template: '<div class="chat-message" ng-class="messageClass">' +
		'<p class="message">{{thing.content || " "}}</p>' +
		'<p class="chat-infos">' +
	        '<span class="author">{{thing.author}}</span>' +
	        '<span class="date" am-time-ago="thing.datetime"></span>' +
        '</p>' +
        '</div>',
		restrict: 'E',
		scope: {
			thing: '='
		},
		link: (scope, element: JQuery, attrs) => {

			scope.$watch('thing.author', () => {
				// TODO this is obviously wrong
				if (scope.thing.author === authenticationService.getUserName()) {
					scope.messageClass = 'my-chat-message';
				} else {
					scope.messageClass = '';
				}
			});
	    }
    };
  });
