'use strict';

var tdigitalNodeBoilerplate = require('../../');

describe('Proof of concept', function() {
  it('should be awesome', function() {
    expect(tdigitalNodeBoilerplate.awesome()).to.equal('awesome');
    tdigitalNodeBoilerplate.awesome().should.equal('awesome');
  });
});
