/**
 * Created by PAVEI on 30/09/2014.
 * Updated by Ross Martin on 12/05/2014
 * Updated by Davide Pastore on 04/14/2015
 * Updated by Michel Vidailhet on 05/12/2015
 * Updated by Rene Korss on 11/25/2015
 */

angular.module('ionicLazyLoad', []);

angular.module('ionicLazyLoad')

.directive('lazyScroll', ['$rootScope',
    function ($rootScope) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
                var origEvent = $scope.$onScroll,
                    showInBatches = $attributes.showInBatches,
                    pendingToShow = [],
                    imagesToLoad = 0,
                    imagesLoaded = 0;
                $scope.$onScroll = function () {
                    $rootScope.$broadcast('lazyScrollEvent');

                    if (typeof origEvent === 'function') {
                        origEvent();
                    }
                };
                $scope.$on('imageLoad.start', function (event, $element) {
                    imagesToLoad++;
                    if (showInBatches) {
                        pendingToShow.push($element);
                    }
                    console.log('images to load: ' + imagesToLoad);
                });
                $scope.$on('imageLoad.end', function (event, $element) {
                    imagesLoaded++;
                    console.log('images loaded: ' + imagesLoaded);

                    if (!showInBatches) {
                        $element[0].style.visibility = '';
                    } else {
                        if (imagesLoaded === imagesToLoad) {
                            console.log('All images loaded');

                            while (pendingToShow.length) {
                                pendingToShow.pop()[0].style.visibility = '';
                            }
                        }
                    }
                });
            }
        };
    }
])

.directive('imageLazySrc', ['$document', '$timeout', '$animate', '$ionicScrollDelegate', '$compile',
    function ($document, $timeout, $animate, $ionicScrollDelegate, $compile) {
        return {
            restrict: 'A',
            scope: {
                lazyScrollResize: "@lazyScrollResize",
                imageLazyBackgroundImage: "@imageLazyBackgroundImage",
                imageLazySrc: "@",
                imageLazyLoadedClass: "@"
            },
            link: function ($scope, $element, $attributes) {
                // hide the element to show it after the image is fully loaded
                $element[0].style.visibility = 'hidden';

                if (!$attributes.imageLazyDistanceFromBottomToLoad) {
                    $attributes.imageLazyDistanceFromBottomToLoad = 0;
                }
                if (!$attributes.imageLazyDistanceFromRightToLoad) {
                    $attributes.imageLazyDistanceFromRightToLoad = 0;
                }

                var loader;
                if ($attributes.imageLazyLoader) {
                    loader = $compile('<div class="image-loader-container"><ion-spinner class="image-loader" icon="' + $attributes.imageLazyLoader + '"></ion-spinner></div>')($scope);
                    $element.after(loader);
                }

                $scope.$watch('imageLazySrc', function (oldV, newV) {
                    if (loader)
                        loader.remove();

                    if (newV) {
                        if ($attributes.imageLazyLoader) {
                            loader = $compile('<div class="image-loader-container"><ion-spinner class="image-loader" icon="' + $attributes.imageLazyLoader + '"></ion-spinner></div>')($scope);
                            $element.after(loader);
                        }
                        var deregistration = $scope.$on('lazyScrollEvent', function () {
                            //    console.log('scroll');
                            if (isInView()) {
                                loadImage();
                                deregistration();
                            }
                        });
                        $timeout(function () {
                            if (isInView()) {
                                loadImage();
                                deregistration();
                            }
                        }, 500);
                    }
                });

                function loadImage() {
                    //Bind "load" event
                    $element.bind("load", function (e) {
                        if ($attributes.imageLazyLoader) {
                            loader.remove();
                        }
                        if ($scope.lazyScrollResize == "true") {
                            //Call the resize to recalculate the size of the screen
                            $ionicScrollDelegate.resize();
                        }
                        $element.unbind("load");

                        if ($scope.imageLazyLoadedClass) {
                            $element.addClass($scope.imageLazyLoadedClass);
                        }

                        $scope.$emit("imageLoad.end", $element);
                    });

                    if ($scope.imageLazyBackgroundImage == "true") {
                        var bgImg = new Image();
                        bgImg.onload = function () {
                            if ($attributes.imageLazyLoader) {
                                loader.remove();
                            }

                            $element[0].style.backgroundImage = 'url(' + $attributes.imageLazySrc + ')'; // set style attribute on element (it will load image)
                            if ($scope.lazyScrollResize == "true") {
                                //Call the resize to recalculate the size of the screen
                                $ionicScrollDelegate.resize();
                            }
                            if ($scope.imageLazyLoadedClass) {
                                $element.addClass($scope.imageLazyLoadedClass);
                            }

                            $scope.$emit("imageLoad.end", $element);
                        };
                        bgImg.onError = function () {
                            if ($attributes.imageLazyLoader) {
                                loader.remove();
                            }
                            $scope.$emit("imageLoad.end", $element);
                        };
                        bgImg.src = $attributes.imageLazySrc;
                    } else {
                        $element[0].src = $attributes.imageLazySrc; // set src attribute on element (it will load image)
                    }

                    $scope.$emit("imageLoad.start", $element);
                }

                function isInView() {
                    var clientHeight = $document[0].documentElement.clientHeight;
                    var clientWidth = $document[0].documentElement.clientWidth;
                    var imageRect = $element[0].getBoundingClientRect();
                    return (imageRect.top >= 0 && imageRect.top <= clientHeight + parseInt($attributes.imageLazyDistanceFromBottomToLoad)) && (imageRect.left >= 0 && imageRect.left <= clientWidth + parseInt($attributes.imageLazyDistanceFromRightToLoad));
                }

                // bind listener
                // listenerRemover = scrollAndResizeListener.bindListener(isInView);

                // unbind event listeners if element was destroyed
                // it happens when you change view, etc
                $element.on('$destroy', function () {
                    //deregistration();
                });
            }
        };
    }
]);