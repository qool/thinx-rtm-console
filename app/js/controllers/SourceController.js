/* Setup blank page controller */
angular.module('MetronicApp').controller('SourceController', ['$rootScope', '$scope', 'settings', function($rootScope, $scope, settings) {
    $scope.$on('$viewContentLoaded', function() {   
        // initialize core components
        App.initAjax();

        // set default layout mode
        $rootScope.settings.layout.pageContentWhite = true;
        $rootScope.settings.layout.pageBodySolid = false;
        $rootScope.settings.layout.pageSidebarClosed = false;

        var jqxhr = Thinx.sourceList()
            .done( function(data) {
                updateSources(data)
            })
            .fail(error => console.log('Error:', error));
    });

    function updateSources(data) {
        console.log(data);

        var data = JSON.parse(data);

        $rootScope.sources = data.sources;
        $scope.$apply()

        console.log('sources:');
        console.log($rootScope.sources);
    }

    $scope.addSource = function() {
	
        console.log('-- adding new source --'); 

        console.log($('#pageModal input[name=sourceUrl]').val());
        console.log($('#pageModal input[name=sourceAlias]').val());

        var jqxhr = Thinx.addSource($('#pageModal input[name=sourceUrl]').val(), $('#pageModal input[name=sourceAlias]').val())
            .done(function(response) {
                
                if (typeof(response) !== 'undefined') {
                    if (response.success) {
                        console.log(response);

                        var jqxhr = Thinx.sourceList()
                            .done( function(data) {
                                updateSources(data)
                            })
                            .fail(error => console.log('Error:', error));

                            toastr.success('Source Added.', 'THiNX RTM Console', {timeOut: 5000})

                        $('#pageModal').modal('hide');

                    } else {
                        console.log(response);
                    }
                } else {
                    console.log('error');
                    console.log(response);
                    toastr.error('Source Failed.', 'THiNX RTM Console', {timeOut: 5000})
                }
            })
            .fail(function(error) {
                $('.msg-warning').text(error);
                $('.msg-warning').show();
                console.log('Error:', error);
                toastr.success('Source Failed.', 'THiNX RTM Console', {timeOut: 5000})
            });

	};

	$scope.revokeSource = function(alias, index) {

		console.log('-- removing source ' + alias + '--'); 

        var jqxhr = Thinx.revokeSource(alias)
            .done(function(response) {
                if (typeof(response) !== 'undefined') {
                    if (response.success) {
                        console.log(response);
                        $rootScope.sources.splice(index, 1);
                        $scope.$apply()
                        toastr.success('Source Removed.', 'THiNX RTM Console', {timeOut: 5000})
                    } else {
                        console.log(response);
                        toastr.success('Source Failed.', 'THiNX RTM Console', {timeOut: 5000})
                    }
                } else {
                    console.log('error');
                    console.log(response);
                    toastr.success('Source Failed.', 'THiNX RTM Console', {timeOut: 5000})
                }
            })
            .fail(function(error) {
                $('.msg-warning').text(error);
                $('.msg-warning').show();
                console.log('Error:', error);
                toastr.success('Source Failed.', 'THiNX RTM Console', {timeOut: 5000})
            });
	};

    $scope.resetModal = function() {
        $('#pageModal input[name=sourceAlias]').val(null);
        $('#pageModal input[name=sourceUrl]').val(null);
        $scope.sourceModal.$setPristine();
    }

}]);
