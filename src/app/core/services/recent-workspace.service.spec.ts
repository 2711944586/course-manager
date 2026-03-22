import { TestBed } from '@angular/core/testing';
import { RecentWorkspaceService } from './recent-workspace.service';

describe('RecentWorkspaceService', () => {
  const storageKey = 'aurora.course-manager.recent-workspace';

  let service: RecentWorkspaceService;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecentWorkspaceService);
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('should dedupe the latest route instead of appending duplicates', () => {
    service.track({
      label: '仪表盘总览',
      route: '/dashboard',
      icon: 'space_dashboard',
      subtitle: 'Mission Control',
    });

    service.track({
      label: '仪表盘总览',
      route: '/dashboard',
      icon: 'space_dashboard',
      subtitle: 'Mission Control',
    });

    expect(service.items().length).toBe(1);
    expect(service.items()[0]?.route).toBe('/dashboard');
  });

  it('should keep only the newest 8 workspace entries', () => {
    for (let index = 0; index < 10; index += 1) {
      service.track({
        label: `页面 ${index}`,
        route: `/page-${index}`,
        icon: 'dashboard',
        subtitle: 'Workspace',
      });
    }

    expect(service.items().length).toBe(8);
    expect(service.items()[0]?.route).toBe('/page-9');
    expect(service.items()[7]?.route).toBe('/page-2');
  });
});
