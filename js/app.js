var angular_app;

angular_app = angular.module('npower-challenge', ['highcharts-ng']);

angular_app.run([
  "$rootScope", function($rootScope) {
    window._ = exports._;
  }
]);
angular_app.config([
  "$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true).hashPrefix('!');
    $routeProvider.when("/", {
      templateUrl: "/partials/wizard.html",
      controller: "MainController"
    });
    $routeProvider.when("/wizard", {
      templateUrl: "/partials/wizard.html",
      controller: "MainController"
    });
    return $routeProvider.otherwise({
      redirectTo: "/"
    });
  }
]);
var AdviceController, FootprintController, MainController, WeatherTrendsController;

MainController = [
  '$rootScope', '$scope', 'consumerDataService', 'tariffsService', '$q', function($rootScope, $scope, consumerDataService, tariffsService, $q) {
    $rootScope.house = {};
    $scope.availablePanels = {
      weather: false,
      household: false,
      advice: false
    };
    return $scope.$watch('house.description', function(newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }
      return consumerDataService.findByDescriptionOrPostcode(newValue, function(house) {
        if (!house) {
          return;
        }
        $rootScope.house = house;
        return tariffsService.getAllTariffs().then(function(tariffs) {
          var tariffArea;
          tariffArea = _.findWhere(tariffs, {
            regionCode: house.areaCode
          });
          return $rootScope.regionName = tariffArea.regionName;
        });
      });
    });
  }
];

WeatherTrendsController = [
  '$rootScope', '$scope', 'consumerDataService', 'weatherDataService', function($rootScope, $scope, consumerDataService, weatherDataService) {
    var areaCode, consumptionToPoints, electricityKwh, findFn, house, myAvgs, postcode, selectedMonthIdx, sortFn, _ref;
    _ref = $scope.house, areaCode = _ref.areaCode, postcode = _ref.postcode, electricityKwh = _ref.electricityKwh;
    weatherDataService.getAreaData(areaCode, function(temps, station) {
      $scope.chart.series[2].data = temps;
      $scope.chart.options.yAxis[0].title.text += " at " + station;
      return $scope.weatherStationName = station;
    });
    sortFn = function(a, b) {
      if (a.wallType === b.wallType) {
        return 0;
      }
      switch (a.wallType) {
        case "Wall Type Solid Wall":
          return -1;
        case "Wall Type Uninsulated Cavity Wall":
          if (b.wallType.match(RegExp("Solid"))) {
            return 1;
          } else {
            return -1;
          }
          break;
        case "Wall Type Insulated Cavity Wall":
          return 1;
      }
    };
    findFn = function(house) {
      return house.postcode.indexOf($scope.house.postcode.split(' ')[0]) === 0;
    };
    consumerDataService.findByProperties(findFn, sortFn, function(houses) {
      return $scope.housesOfSamePostcodeArea = houses;
    });
    consumerDataService.getPrincipalConsumptionMonths(function(data) {
      $scope.principalConsumptionMonthGasAvg = data.gasAverage[1];
      $scope.principalConsumptionMonthElecAvg = data.elecAverage[1];
      $scope.principalConsumptionMonthGas = data.gas[0];
      return $scope.principalConsumptionMonthElec = data.elec[0];
    });
    house = $scope.house;
    myAvgs = consumerDataService.getPrincipalConsumptionMonthsForConsumer(house);
    $scope.myHighestGasConsumption = myAvgs.gasAverage[1].toFixed(0);
    $scope.myHighestElecConsumption = myAvgs.elecAverage[1].toFixed(0);
    $scope.percentageOfMax = function(type, value, maxPercent) {
      var max;
      if (maxPercent == null) {
        maxPercent = 100;
      }
      switch (type) {
        case 'elec':
          max = 3000;
          break;
        case 'gas':
          max = 4000;
      }
      return Math.min((value / max) * maxPercent, maxPercent);
    };
    $scope.getHouseSizeClass = function(house) {
      var classes;
      classes = [];
      switch (house.bedrooms) {
        case '1 to 2':
          classes.push('size-small');
          break;
        case '3':
          classes.push('size-med');
          break;
        case '4 +':
          classes.push('size-large');
      }
      if (house.postcode === postcode && house.electricityKwh === electricityKwh) {
        classes.push('yours');
      }
      return classes;
    };
    selectedMonthIdx = 0;
    $scope.months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    $scope.prevMonth = function() {
      return selectedMonthIdx = Math.max(selectedMonthIdx - 1, 0);
    };
    $scope.nextMonth = function() {
      return selectedMonthIdx = Math.min(selectedMonthIdx + 1, 12);
    };
    $scope.getMonth = function() {
      var mths;
      mths = $scope.months;
      return mths[selectedMonthIdx];
    };
    consumptionToPoints = function(consumptionArray) {
      return _.map(_.values(consumptionArray), function(val) {
        return parseFloat(val);
      });
    };
    return $scope.chart = {
      title: {
        text: "Energy usage vs climate"
      },
      legend: {
        enabled: false
      },
      series: [
        {
          name: "Electricity Usage",
          color: "#9264aa",
          type: "column",
          yAxis: 1,
          data: consumptionToPoints($scope.house.elecConsumption)
        }, {
          name: "Gas Usage",
          color: "#aa8064",
          type: "column",
          yAxis: 1,
          data: consumptionToPoints($scope.house.gasConsumption)
        }, {
          name: "Max Temperature (deg C)",
          color: "#7caa64",
          type: "spline",
          data: []
        }
      ],
      options: {
        xAxis: [
          {
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
          }
        ],
        yAxis: [
          {
            labels: {
              formatter: function() {
                return this.value + "°C";
              },
              style: {
                color: "#DDDF0D"
              },
              align: "left",
              x: 0,
              y: -2
            },
            showFirstLabel: false,
            title: {
              text: "Temperature",
              style: {
                color: "#89A54E"
              }
            }
          }, {
            title: {
              text: "Energy usage",
              style: {
                color: "#4572A7"
              }
            },
            labels: {
              align: "right",
              x: 0,
              y: -2,
              formatter: function() {
                return this.value + " kWh";
              },
              style: {
                color: "#4572A7"
              }
            },
            showFirstLabel: false,
            opposite: true
          }
        ],
        tooltip: {
          formatter: function() {
            var seriesName, usageMatch;
            seriesName = this.series.name;
            usageMatch = seriesName.match(/[A-Za-z ]+Usage$/);
            return "" + this.x + ": " + Number(this.y).toFixed(1) + (usageMatch ? " kWh " + (seriesName.toLowerCase()) : "°C");
          }
        }
      }
    };
  }
];

FootprintController = [
  '$scope', 'stuffRegistry', function($scope, stuffRegistry) {
    return $scope.getItemSelectedClass = function(itemKey, selection) {
      var _ref;
      if (!_.isObject(stuffRegistry.stuff[itemKey])) {
        if (stuffRegistry.stuff[itemKey] === selection) {
          return 'selected';
        }
        return '';
      } else {
        if ((_ref = stuffRegistry.stuff[itemKey]) != null ? _ref[selection] : void 0) {
          return 'selected';
        }
        return '';
      }
    };
  }
];

AdviceController = [
  '$scope', 'stuffRegistry', function($scope, stuffRegistry) {
    $scope.getLoftInsulationRank = function(house) {
      switch (house.loftInsulation) {
        case 'Loft Insulation More Than 150mm':
          return 1;
        case 'Loft Insulation Between 50 and 150mm':
          return 2;
        case 'Loft Insulation Between 0 and 50mm':
          return 3;
        default:
          return 0;
      }
    };
    $scope.getWallInsulationRank = function(house) {
      switch (house.wallType) {
        case 'Wall Type Insulated Cavity Wall':
          return 1;
        case 'Wall Type Uninsulated Cavity Wall':
          return 2;
        case 'Wall Type Solid Wall':
          return 3;
        default:
          return 0;
      }
    };
    $scope.getHouseTypeCostRank = function(house) {
      switch (house.propertyType) {
        case 'Flat':
          return 1;
        case 'Terraced':
          return 2;
        case 'Bungalow':
          return 3;
        case 'Semi-detached':
          return 4;
        case 'Detached':
          return 5;
        default:
          return 0;
      }
    };
    $scope.getHouseRoomsRank = function(house) {
      switch (house.bedrooms) {
        case '1 to 2':
          return 1;
        case '3':
          return 2;
        case '4 +':
          return 3;
        default:
          return 0;
      }
    };
    $scope.isHouseCentrallyHeated = function(house) {
      switch (house.centralHeating) {
        case 'Yes':
          return true;
        case 'No':
          return false;
        default:
          return false;
      }
    };
    $scope.ofgemTypicals = {
      low: [11000, 2100],
      typical: [16500, 3300],
      high: [23000, 5100]
    };
    $scope.getOfgemUsageRank = function(house) {
      var ourEnergies, ourRank, ourUsages;
      ourUsages = {
        gasKwh: parseInt(house.gasKwh),
        elecKwh: parseInt(house.electricityKwh)
      };
      ourEnergies = ourRank = 'n/a';
      _.pairs($scope.ofgemTypicals).forEach(function(item) {
        var averages, energies, rank, _ref, _ref1;
        _ref = [item[0], item[1]], rank = _ref[0], averages = _ref[1];
        energies = [];
        if (ourUsages.gasKwh > averages[0]) {
          energies.push('gas');
        }
        if (ourUsages.elecKwh > averages[1]) {
          energies.push('electricity');
        }
        if (energies.length > 0) {
          return _ref1 = [rank, energies.join(' and ')], ourRank = _ref1[0], ourEnergies = _ref1[1], _ref1;
        }
      });
      return [ourRank, ourEnergies];
    };
    $scope.getOfgemUsageRankBand = function(house) {
      return $scope.getOfgemUsageRank(house)[0];
    };
    $scope.getOfgemUsageRankEnergies = function(house) {
      return $scope.getOfgemUsageRank(house)[1];
    };
    $scope.shouldShowOfgemUsageInSecondColumn = function(house) {
      switch ($scope.getOfgemUsageRank(house)[0]) {
        case 'low':
          return true;
        case 'typical':
          return true;
        default:
          return false;
      }
    };
    $scope.shouldShowOfgemUsageInFirstColumn = function(house) {
      switch ($scope.getOfgemUsageRank(house)[0]) {
        case 'high':
          return true;
        default:
          return false;
      }
    };
    $scope.getOfgemTypicalUsageForBand = function(energy, band) {
      var _ref, _ref1;
      switch (energy) {
        case 'gas':
          return (_ref = $scope.ofgemTypicals[band]) != null ? _ref[0] : void 0;
        case 'elec':
          return (_ref1 = $scope.ofgemTypicals[band]) != null ? _ref1[1] : void 0;
      }
    };
    return $scope.householdStuff = stuffRegistry.stuff;
  }
];
angular_app.directive("wizardStep", [
  "$rootScope", function($rootScope) {
    return {
      restrict: 'C',
      controller: [
        "$scope", "stuffRegistry", function($scope, stuffRegistry) {
          $scope.currentStep = 1;
          $scope.showStep = function(step) {
            return $scope.currentStep = parseInt(step);
          };
          $scope.runFinalStepActions = function() {
            $scope.availablePanels.weather = true;
            $scope.availablePanels.household = true;
            return $scope.availablePanels.advice = true;
          };
          return $scope.stuff = stuffRegistry.stuff;
        }
      ],
      link: function(scope, elem, attrs) {
        var ourStep;
        ourStep = parseInt(elem.data('step'));
        return scope.$watch('currentStep', function(newValue) {
          var clazz;
          if (newValue === ourStep) {
            elem.addClass('current-step').removeClass('proceeding-step preceeding-step');
            if (attrs.final) {
              return scope.runFinalStepActions();
            }
          } else {
            if (newValue < ourStep) {
              clazz = 'proceeding-step';
            } else {
              clazz = 'preceeding-step';
            }
            return elem.addClass(clazz).removeClass('current-step');
          }
        });
      }
    };
  }
]).directive("postcodeTypeaheadBox", [
  "$rootScope", "consumerDataService", "tariffsService", function($rootScope, consumerDataService, tariffsService) {
    return {
      restrict: 'C',
      link: function(scope, elem, attrs) {
        tariffsService.getAllTariffs();
        return consumerDataService.getAllConsumerData().then(function(consumerData) {
          var descriptions;
          descriptions = consumerData.map(function(data) {
            var propertyTypeLower;
            propertyTypeLower = data.propertyType.toLowerCase();
            return "" + data.postcode + ", " + propertyTypeLower + ", " + data.bedrooms + " bedrooms";
          });
          return elem.typeahead({
            source: descriptions,
            updater: function(description) {
              scope.$apply(function() {
                var scopeVar;
                scopeVar = attrs.ngModel;
                return eval("scope." + scopeVar + " = '" + description + "'");
              });
              return description;
            },
            highlighter: function(item) {
              return item;
            }
          });
        });
      }
    };
  }
]).directive("privacyInformationLink", [
  "$rootScope", function($rootScope) {
    return {
      restrict: 'C',
      link: function(scope, elem, attrs) {
        return elem.popover({
          content: attrs['data-content']
        });
      }
    };
  }
]).directive("insulatedHouse", [
  function() {
    return {
      restrict: 'AC',
      link: function(scope, elem, attrs) {
        var clazz;
        clazz = (function() {
          switch (scope.otherHouse.loftInsulation) {
            case "Loft Insulation Between 0 and 50mm":
              return 'insulation-thin';
            case "Loft Insulation Between 50 and 150mm":
              return 'insulation-med';
            case "Loft Insulation More Than 150mm":
              return 'insulation-thick';
          }
        })();
        return elem.addClass(clazz);
      }
    };
  }
]).directive("scrollToTargetButton", [
  function() {
    return {
      restrict: 'AC',
      link: function(scope, elem, attrs) {
        if (attrs != null ? attrs.title : void 0) {
          elem.parent().tooltip({
            title: attrs.title,
            placement: 'right'
          });
        }
        return elem.click(function() {
          var offsetTop;
          offsetTop = 0;
          if (attrs != null ? attrs.dest : void 0) {
            offsetTop = $('#' + attrs.dest).offset().top;
          }
          return $('html, body').animate({
            scrollTop: offsetTop
          }, 1000);
        });
      }
    };
  }
]).directive("offsetActivatedBehaviour", [
  function() {
    return {
      restrict: 'AC',
      link: function(scope, elem, attrs) {
        var behaviours;
        behaviours = {
          setSidebarNavColour: function() {
            var currentColor, secondSectionOffset;
            secondSectionOffset = $('#content > section.second').offset().top;
            currentColor = elem.css('color');
            if (elem.offset().top < secondSectionOffset) {
              if (currentColor === 'rgb(0, 0, 0)') {
                return elem.css({
                  color: 'rgb(255, 255, 255)'
                });
              }
            } else {
              if (currentColor === 'rgb(255, 255, 255)') {
                return elem.css({
                  color: 'rgb(0, 0, 0)'
                });
              }
            }
          }
        };
        return $(window).scroll(function() {
          var scrollTop;
          scrollTop = $(this).scrollTop();
          return behaviours[attrs.behaviour](scrollTop);
        });
      }
    };
  }
]).directive("peakConsumptionMonthCircle", [
  "consumerDataService", function(consumerDataService) {
    return {
      restrict: 'AC',
      link: function(scope, elem, attrs) {
        var house, myAvgs;
        house = scope.house;
        myAvgs = consumerDataService.getPrincipalConsumptionMonthsForConsumer(house);
        if (myAvgs.gasAverage[1] > 0) {
          scope.$watch('principalConsumptionMonthGas', function(newValue) {
            var avg;
            if (scope.month === newValue) {
              avg = scope.principalConsumptionMonthGasAvg;
              return elem.removeClass('hidden-phone').addClass('gas-national-average').attr({
                'data-energy': 'gas',
                'title': "" + (avg.toFixed(0)) + " kWh"
              });
            } else if (scope.month === myAvgs.gasMonth) {
              return elem.addClass('gas-my-peak');
            }
          });
        }
        if (myAvgs.elecAverage[1] > 0) {
          return scope.$watch('principalConsumptionMonthElec', function(newValue) {
            var avg;
            if (scope.month === newValue) {
              avg = scope.principalConsumptionMonthElecAvg;
              return elem.removeClass('hidden-phone').addClass('elec-national-average').attr({
                'data-energy': 'electricity',
                'title': "" + (avg.toFixed(0)) + " kWh"
              });
            } else if (scope.month === myAvgs.elecMonth) {
              return elem.addClass('elec-my-peak');
            }
          });
        }
      }
    };
  }
]).directive("fullViewportHeight", [
  function() {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        var setHeightFn;
        setHeightFn = function() {
          return elem.css({
            'min-height': $(window).height()
          });
        };
        $(window).resize(_.debounce(setHeightFn, 500));
        return setHeightFn();
      }
    };
  }
]).directive("carousel", [
  function() {
    return {
      restrict: 'C',
      link: function(scope, elem, attrs) {
        elem.carousel({
          interval: false
        });
        elem.find('.carousel-control.left').click(function() {
          return elem.carousel('prev');
        });
        return elem.find('.carousel-control.right').click(function() {
          return elem.carousel('next');
        });
      }
    };
  }
]).directive("tooltip", [
  function() {
    return {
      restrict: 'AC',
      link: function(scope, elem, attrs) {
        return elem.tooltip();
      }
    };
  }
]);
angular.module("highcharts-ng", []).directive("highchart", function() {
  var ensureIds, getMergedOptions, seriesId;
  seriesId = 0;
  ensureIds = function(series) {
    return series.forEach(function(s) {
      if (!angular.isDefined(s.id)) {
        return s.id = "series-" + seriesId++;
      }
    });
  };
  getMergedOptions = function(element, options) {
    var defaultOptions, mergedOptions;
    defaultOptions = {
      chart: {
        renderTo: element[0]
      },
      title: {},
      series: []
    };
    mergedOptions = {};
    if (options) {
      mergedOptions = $.extend(true, {}, defaultOptions, options);
    } else {
      mergedOptions = defaultOptions;
    }
    return mergedOptions;
  };
  return {
    restrict: "EC",
    replace: false,
    scope: {
      series: "=",
      options: "=",
      title: "="
    },
    link: function(scope, element, attrs) {
      var chart, mergedOptions;
      mergedOptions = getMergedOptions(element, scope.options);
      chart = new Highcharts.Chart(mergedOptions);
      scope.$watch("series", (function(newSeries, oldSeries) {
        var ids;
        ensureIds(newSeries);
        ids = [];
        newSeries.forEach(function(s) {
          var chartSeries;
          ids.push(s.id);
          chartSeries = chart.get(s.id);
          if (chartSeries) {
            return chartSeries.update(angular.copy(s), false);
          } else {
            return chart.addSeries(angular.copy(s), false);
          }
        });
        chart.series.forEach(function(s) {
          if (ids.indexOf(s.options.id) < 0) {
            return s.remove(false);
          }
        });
        return chart.redraw();
      }), true);
      scope.$watch("title", (function(newTitle) {
        return chart.setTitle(newTitle, true);
      }), true);
      return scope.$watch("options", (function(newOptions, oldOptions, scope) {
        if (newOptions === oldOptions) {
          return;
        }
        chart.destroy();
        mergedOptions = getMergedOptions(element, newOptions);
        chart = new Highcharts.Chart(mergedOptions);
        chart.setTitle(scope.title, true);
        ensureIds(scope.series);
        scope.series.forEach(function(s) {
          return chart.addSeries(angular.copy(s), false);
        });
        return chart.redraw();
      }), true);
    }
  };
});
var APPLIANCES_ENDPOINT, CONSUMER_DATA_ENDPOINT, REGION_TARIFFS_ENDPOINT, WEATHER_DATA_ENDPOINT, fetchOrCacheXml,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

REGION_TARIFFS_ENDPOINT = '/data/regionTariffs.xml';

CONSUMER_DATA_ENDPOINT = '/data/consumerData.xml';

APPLIANCES_ENDPOINT = '/data/appliances.xml';

WEATHER_DATA_ENDPOINT = '/data/metWeatherData.json';

fetchOrCacheXml = function(url, deferred, manipulatorFn, scope) {
  var browserSupportsStorage, xml;
  browserSupportsStorage = __indexOf.call(window, 'localStorage') >= 0 && (window['localStorage'] != null);
  if (!browserSupportsStorage || !localStorage[url]) {
    return $.ajax({
      dataType: 'xml',
      url: url,
      success: function(xml) {
        return scope.$apply(function() {
          if (browserSupportsStorage) {
            localStorage[url] = xml;
          }
          return deferred.resolve(manipulatorFn(xml));
        });
      },
      error: deferred.reject
    });
  } else {
    xml = localStorage[url];
    return deferred.resolve(manipulatorFn(xml));
  }
};

angular_app.factory("tariffsService", [
  "$q", "$rootScope", "$http", function($q, $rootScope, $http) {
    return {
      getAllTariffs: function() {
        var deferred;
        deferred = $q.defer();
        fetchOrCacheXml(REGION_TARIFFS_ENDPOINT, deferred, function(xml) {
          var template;
          template = [
            "//region", {
              regionCode: "@regionCode",
              regionName: "@regionName",
              tariffs: [
                "tariffs/tariff", {
                  name: "@name",
                  electricity: {
                    standingCharge: "fuel[@fuelType=\"E\"]/@standingCharge",
                    unitRate: "fuel[@fuelType=\"E\"]/@unitRate"
                  },
                  gas: {
                    standingCharge: "fuel[@fuelType=\"G\"]/@standingCharge",
                    unitRate: "fuel[@fuelType=\"G\"]/@unitRate"
                  }
                }
              ]
            }
          ];
          return Jath.parse(template, xml);
        }, $rootScope);
        return deferred.promise;
      }
    };
  }
]).factory("consumerDataService", [
  "$q", "$rootScope", "$http", function($q, $rootScope, $http) {
    var consumerDataService;
    consumerDataService = {};
    return _.extend(consumerDataService, {
      getAllConsumerData: function() {
        var deferred;
        deferred = $q.defer();
        fetchOrCacheXml(CONSUMER_DATA_ENDPOINT, deferred, function(xml) {
          var items, template;
          template = [
            "//consumptionData", {
              currentSupplier: "@currentSupplier",
              tariff: "@tariff",
              postcode: "@Postcode",
              areaCode: "@areaCode",
              propertyType: "@propertyType",
              bedrooms: "@bedrooms",
              propertyBuilt: "@propertyBuilt",
              numberofBathrooms: "@numberofBathrooms",
              electricityKwh: "@electricityKwh",
              gasKwh: "@gasKwh",
              centralHeating: "@centralHeating",
              loftInsulation: "@loftInsulation",
              wallType: "@wallType",
              gasConsumption: {
                jan: "gasConsumption/@jan",
                feb: "gasConsumption/@feb",
                mar: "gasConsumption/@mar",
                apr: "gasConsumption/@apr",
                may: "gasConsumption/@may",
                jun: "gasConsumption/@jun",
                jul: "gasConsumption/@jul",
                aug: "gasConsumption/@aug",
                sep: "gasConsumption/@sep",
                oct: "gasConsumption/@oct",
                nov: "gasConsumption/@nov",
                dec: "gasConsumption/@dec"
              },
              elecConsumption: {
                jan: "elecConsumption/@jan",
                feb: "elecConsumption/@feb",
                mar: "elecConsumption/@mar",
                apr: "elecConsumption/@apr",
                may: "elecConsumption/@may",
                jun: "elecConsumption/@jun",
                jul: "elecConsumption/@jul",
                aug: "elecConsumption/@aug",
                sep: "elecConsumption/@sep",
                oct: "elecConsumption/@oct",
                nov: "elecConsumption/@nov",
                dec: "elecConsumption/@dec"
              }
            }
          ];
          items = Jath.parse(template, xml);
          return items;
        }, $rootScope);
        return deferred.promise;
      },
      findByPostcode: function(postcode, callbackFn) {
        return consumerDataService.getAllConsumerData().then(function(data) {
          var house;
          house = _.findWhere(data, {
            postcode: postcode
          });
          if (house) {
            house.foundViaWebService = true;
          }
          return typeof callbackFn === "function" ? callbackFn(house) : void 0;
        });
      },
      findByDescriptionOrPostcode: function(description, callbackFn) {
        var attrs, regex;
        regex = /([a-zA-Z0-9 ]+)(, ([a-z\-]+), ([a-z0-9 +]+) bedrooms)?/;
        attrs = description.match(regex);
        if (!attrs) {
          return;
        }
        return consumerDataService.getAllConsumerData().then(function(data) {
          var house, query;
          query = {
            postcode: attrs[1].toUpperCase()
          };
          if (attrs[3]) {
            query.propertyType = _.first(attrs[3]).toUpperCase() + attrs[3].slice(1);
          }
          if (attrs[4]) {
            query.bedrooms = attrs[4];
          }
          house = _.findWhere(data, query);
          if (!house) {
            return;
          }
          house.description = description;
          if (house) {
            house.foundViaWebService = true;
          }
          return typeof callbackFn === "function" ? callbackFn(house) : void 0;
        });
      },
      findByProperties: function(propertiesOrFn, compareFn, callbackFn) {
        return consumerDataService.getAllConsumerData().then(function(data) {
          var houses;
          if (typeof propertiesOrFn !== 'function') {
            houses = _.where(data, propertiesOrFn);
          } else {
            houses = _.select(data, propertiesOrFn);
          }
          if (compareFn) {
            houses = houses.sort(compareFn);
          }
          return typeof callbackFn === "function" ? callbackFn(houses) : void 0;
        });
      },
      getTotalMonthlyConsumption: function(callbackFn) {
        return consumerDataService.getAllConsumerData().then(function(data) {
          var ret;
          ret = _(['elecConsumption', 'gasConsumption']).map(function(type) {
            return [
              type, _(data).reduce(function(memo, item) {
                _.pairs(item[type]).forEach(function(pair) {
                  return memo[pair[0]] += parseFloat(pair[1]);
                });
                return memo;
              }, {
                jan: 0,
                feb: 0,
                mar: 0,
                apr: 0,
                may: 0,
                jun: 0,
                jul: 0,
                aug: 0,
                sep: 0,
                oct: 0,
                nov: 0,
                dec: 0
              })
            ];
          });
          return typeof callbackFn === "function" ? callbackFn(_.object(ret), data.length) : void 0;
        });
      },
      getPrincipalConsumptionMonths: function(callbackFn) {
        return consumerDataService.getTotalMonthlyConsumption(function(consumer, propCnt) {
          var ret, svc;
          svc = consumerDataService;
          ret = svc.getPrincipalConsumptionMonthsForConsumer(consumer, propCnt);
          return typeof callbackFn === "function" ? callbackFn(ret) : void 0;
        });
      },
      getPrincipalConsumptionMonthsForConsumer: function(consumerData, propCnt) {
        var eSum, gSum, maxIterFn;
        if (propCnt == null) {
          propCnt = 1;
        }
        maxIterFn = function(pair) {
          return parseFloat(pair[1]);
        };
        return {
          gas: gSum = _.max(_.pairs(consumerData.gasConsumption), maxIterFn),
          elec: eSum = _.max(_.pairs(consumerData.elecConsumption), maxIterFn),
          gasMonth: gSum[0],
          elecMonth: eSum[0],
          gasAverage: [gSum[0], gSum[1] / propCnt],
          elecAverage: [eSum[0], eSum[1] / propCnt]
        };
      }
    });
  }
]).factory("appliancesService", [
  "$q", "$rootScope", "$http", function($q, $rootScope, $http) {
    return {
      getAllTariffs: function() {
        var deferred;
        deferred = $q.defer();
        fetchOrCacheXml(APPLIANCES_ENDPOINT, deferred, function(xml) {
          var template;
          template = [
            "//appliance", {
              name: "@name",
              wattage: "@wattage"
            }
          ];
          return Jath.parse(template, xml);
        }, $rootScope);
        return deferred.promise;
      }
    };
  }
]).factory("weatherDataService", [
  "$http", function($http) {
    var weatherDataService;
    weatherDataService = {};
    return _.extend(weatherDataService, {
      getWeatherData: function() {
        return $http.get(WEATHER_DATA_ENDPOINT);
      },
      getAreaData: function(areaCode, successFn) {
        return weatherDataService.getWeatherData().success(function(weatherData) {
          var allMetrics, data, temps;
          data = _.findWhere(weatherData, {
            regionCode: parseInt(areaCode)
          });
          allMetrics = _.values(data.monthlyData);
          temps = _.map(_.pluck(allMetrics, 'maxDegC'), function(temp) {
            return parseFloat(temp);
          });
          return successFn(temps, data.station);
        });
      }
    });
  }
]).factory("stuffRegistry", [
  "$rootScope", function($rootScope) {
    var getterFn, registry, setterFn;
    registry = {
      stuff: {
        fields: {}
      }
    };
    setterFn = function(key, val) {
      registry.stuff.fields[key] = val;
      return $rootScope.$broadcast('householdItemsRegistered');
    };
    getterFn = function(key) {
      return registry.stuff.fields[key];
    };
    ['lighting', 'television', 'standby'].forEach(function(prop) {
      registry.stuff.__defineSetter__(prop, setterFn.bind(this, prop));
      return registry.stuff.__defineGetter__(prop, getterFn.bind(this, prop));
    });
    return registry;
  }
]);
