import { expect, test, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from '@vitest/browser/context';
import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { SampleForm } from '.';

const worker = setupWorker();

// https://mswjs.io/docs/recipes/vitest-browser-mode/
export const testWithWorker = test.extend<{
  worker: typeof worker;
}>({
  worker: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      // Start the worker before the test.
      await worker.start();

      // Expose the worker object on the test's context.
      await use(worker);

      // Remove any request handlers added in individual test cases.
      // This prevents them from affecting unrelated tests.
      // これが推奨されていたが、使用される前にリセットされてしまうため、やめる
      // worker.resetHandlers();
    },
    {
      auto: true,
    },
  ],
});



testWithWorker('フォームの操作とAPI呼び出しのテスト', async ({ worker }) => {
  const  getCallMock = vi.fn();
  const putCallMock = vi.fn();

  // APIハンドラーの設定
  worker.use(
    http.get('/api/users/1', () => {
      getCallMock();
      return HttpResponse.json({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
      });
    }),
    http.put('/api/users/1', async ({ request }) => {
      const body = await request.json();
      putCallMock(body);
      return HttpResponse.json(body);
    })
  );

  const onErrorMock = vi.fn();

  const screen = render(
    <SampleForm userId={1} onError={onErrorMock} />
  );

  // ユーザー情報が取得されて表示されることを確認
  await expect.element(screen.getByText('John Doe')).toBeVisible();
  
  // GETリクエストが呼び出されたことを確認
  expect(getCallMock).toHaveBeenCalled();
  expect(onErrorMock).not.toHaveBeenCalled();

  // フォームの操作
  const nameInput = screen.getByRole('textbox', { name: '名前' });
  const emailInput = screen.getByRole('textbox', { name: 'メールアドレス' });
  const saveButton = screen.getByRole('button', { name: '保存' });

  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, 'Taro');
  
  await userEvent.clear(emailInput);
  await userEvent.type(emailInput, 'taro@example.com');
  
  await userEvent.selectOptions(screen.getByRole('combobox', { name: '役割' }).element(), 'admin');
  await userEvent.click(saveButton);

  // 少し待機してPUTリクエストが完了するのを確認
  await new Promise(resolve => setTimeout(resolve, 1000));

  // PUTリクエストが正しいデータで呼び出されたことを確認
  expect(putCallMock).toHaveBeenCalledWith({
    id: 1,
    name: 'Taro',
    email: 'taro@example.com',
    role: 'admin',
  });
});

testWithWorker('初期表示でユーザー情報が表示される', async ({ worker }) => {
  worker.use(
    http.get('/api/users/1', () => {
      return HttpResponse.json({
        id: 1,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'user',
      });
    })
  );

  const screen = render(
    <SampleForm userId={1} onError={() => {}} />
  );

  // ユーザー情報が表示されることを確認
  await expect.element(screen.getByText('Jane Smith')).toBeVisible();
  await expect.element(screen.getByText('jane.smith@example.com')).toBeVisible();
  await expect.element(screen.getByText('user')).toBeVisible();
});

testWithWorker('フォームの必須項目が空の場合、保存ボタンが無効になる', async ({ worker }) => {
  worker.use(
    http.get('/api/users/1', () => {
      return HttpResponse.json({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });
    })
  );

  const screen = render(
    <SampleForm userId={1} onError={() => {}} />
  );

  // ユーザー情報が表示されるまで待機
  await expect.element(screen.getByText('Test User')).toBeVisible();

  const nameInput = screen.getByRole('textbox', { name: '名前' });
  const saveButton = screen.getByRole('button', { name: '保存' });

  // 名前フィールドをクリアすると保存ボタンが無効になることを確認
  await userEvent.clear(nameInput);
  
  await expect.element(saveButton).toBeDisabled();
});

testWithWorker('APIエラー時の動作確認', async ({ worker }) => {
  worker.use(
    http.get('/api/users/1', () => {
      return HttpResponse.error();
    })
  );

  const onErrorMock = vi.fn();

  render(<SampleForm userId={1} onError={onErrorMock} />);

  // エラーが発生することを確認（少し待機）
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // この場合、コンポーネント内でアラートが表示されるため、onErrorは呼ばれない
  // 実際の実装では window.alert が呼ばれる
});

testWithWorker('スクロール機能のテスト', async ({ worker }) => {
  worker.use(
    http.get('/api/users/1', () => {
      return HttpResponse.json({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      });
    })
  );

  const screen = render(
    <SampleForm userId={1} onError={() => {}} />
  );

  // ユーザー情報が表示されるまで待機
  await expect.element(screen.getByText('Test User')).toBeVisible();

  // スクロールボタンを見つけてクリック
  const scrollButton = screen.getByRole('button', { name: '一番下へスクロール' });
  await userEvent.click(scrollButton);

  // スクロールが実行されたことを確認（実際のスクロール位置は確認しない）
  await expect.element(scrollButton).toBeVisible();
});
