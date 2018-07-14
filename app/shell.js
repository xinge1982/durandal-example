define(['plugins/router'], function (router) {
    return {
        router: router,
        activate: function () {
            return router.map([
                { route: ['', 'home'], moduleId: 'viewmodels/report', title: 'Report', nav: 1 },
                { route: 'setting', moduleId: 'viewmodels/setting', title: 'Setting', nav: true },
                { route: 'view-composition', moduleId: 'viewComposition/index', title: 'View Composition', nav: true },
                { route: 'modal', moduleId: 'modal/index', title: 'Modal Dialogs', nav: 3 },
                { route: 'event-aggregator', moduleId: 'eventAggregator/index', title: 'Events', nav: 2 },
                { route: 'widgets', moduleId: 'widgets/index', title: 'Widgets', nav: true },
                { route: 'master-detail', moduleId: 'masterDetail/index', title: 'Master Detail', nav: true },
                { route: 'knockout-samples*details', moduleId: 'ko/index', title: 'Knockout Samples', nav: true },
                { route: 'keyed-master-details/:id*details', moduleId: 'keyedMasterDetail/master', title: 'Keyed Master Detail', hash: '#keyed-master-details/:id' }
            ]).buildNavigationModel()
                .mapUnknownRoutes('hello/index', 'not-found')
                .activate();
        },

        compositionComplete: function(view) {
            console.log('Lifecycle : compositionComplete : shell');
            $(document).trigger('nifty.ready');
        }
    };
});