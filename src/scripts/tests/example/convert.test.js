// Write Your Jasmine Test Here
var Convert = require('../../example/convert.js');
describe("volume converter", function () {
  it("converts litres to gallons", function () {
    expect(Convert(3, "litres").to("gallons")).toEqual(0.79); // <--- This should fail!! Find the bug and fix it!! :D
  });

  it("converts gallons to cups", function () {
    expect(Convert(2, "gallons").to("cups")).toEqual(32);
  });
  it("throws an error when passed an unknown from-unit", function () {
    var testFn = function () {
      Convert(1, "dollar").to("yens");
    };
    expect(testFn).toThrow(new Error("unrecognized from-unit"));
  });

  it("throws an error when passed an unknown to-unit", function () {
    var testFn = function () {
      Convert(1, "cm").to("furlongs");
    };
    expect(testFn).toThrow(new Error("unrecognized to-unit"));
  });
});