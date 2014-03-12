'use strict';

describe('Controller: OrdertoolbarCtrl', function () {

  // load the controller's module
  beforeEach(module('mobileMasterApp'));

  var OrdertoolbarCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    OrdertoolbarCtrl = $controller('OrdertoolbarCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
