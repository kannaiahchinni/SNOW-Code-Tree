import { TestBed, inject } from '@angular/core/testing';

import { XapiService } from './xapi.service';

describe('XapiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [XapiService]
    });
  });

  it('should be created', inject([XapiService], (service: XapiService) => {
    expect(service).toBeTruthy();
  }));
});
