import * as SecureStore from 'expo-secure-store';
import { getEnabled, setEnabled } from '@/features/lockscreen/lockscreenPreference';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;

describe('lockscreenPreference', () => {
  beforeEach(() => {
    mockGetItemAsync.mockReset();
    mockSetItemAsync.mockReset();
  });

  it('defaults to false (FR-001) when nothing has been stored yet', async () => {
    mockGetItemAsync.mockResolvedValue(null);
    expect(await getEnabled()).toBe(false);
  });

  it('is true once persisted as "true"', async () => {
    mockGetItemAsync.mockResolvedValue('true');
    expect(await getEnabled()).toBe(true);
  });

  it('is false for any stored value other than "true"', async () => {
    mockGetItemAsync.mockResolvedValue('false');
    expect(await getEnabled()).toBe(false);
  });

  it('persists true/false as the string "true"/"false" (FR-012)', async () => {
    await setEnabled(true);
    expect(mockSetItemAsync).toHaveBeenCalledWith('lockscreen_timeline_enabled', 'true');

    await setEnabled(false);
    expect(mockSetItemAsync).toHaveBeenCalledWith('lockscreen_timeline_enabled', 'false');
  });
});
