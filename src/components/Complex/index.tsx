import { useState, useEffect, useCallback } from "react";
import "./style.css";
import { useMobile } from "./hooks";
import { formTitle } from "./module";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserProfileFormProps {
  userId: number;

  /**
   * エラー発生時のコールバック
   */
  onError: (error: string) => void;
}

export const SampleForm = ({ userId, onError }: UserProfileFormProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const { isMobile } = useMobile();

  // 初期データの取得
  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const fetchedUser = await response.json();

        if (isMounted) {
          setUser(fetchedUser);
          setName(fetchedUser.name);
          setEmail(fetchedUser.email);
          setRole(fetchedUser.role);
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "ユーザー情報の取得に失敗しました";
          window.alert(errorMessage);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // ユーザー情報を保存
  const updateUser = useCallback(
    async (userData: User) => {
      try {
        setSaving(true);
        const response = await fetch(`/api/users/${userData.id}`, {
          method: "PUT",
          body: JSON.stringify(userData),
        });
        await response.json();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "ユーザー情報の保存に失敗しました";
        onError?.(errorMessage);
      } finally {
        setSaving(false);
      }
    },
    [onError]
  );

  return (
    <div
      className={`user-profile-form ${
        isMobile ? "mobile-layout" : "desktop-layout"
      }`}
    >
      <h2>{formTitle}</h2>

      <p className="scroll-controls">
        <button
          onClick={() => {
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "smooth",
            });
          }}
          className="scroll-button"
          aria-label="一番下へスクロール"
        >
          ⬇️
        </button>
      </p>

      {/* 画面サイズ情報表示 */}
      <div className="screen-info">
        <p>
          <strong>モバイル表示:</strong>{" "}
          <span>{isMobile ? "はい" : "いいえ"}</span>
        </p>
      </div>

      {/* モバイル専用ハンバーガーメニューボタン */}
      {isMobile && (
        <div className="mobile-only">
          これは画面が狭いときだけ表示されるはずだよ
        </div>
      )}

      <div className="user-fetch-section">
        <h3>ユーザー情報取得</h3>

        {user && (
          <div className="user-info">
            <p>
              <strong>ID:</strong> <span>{user.id}</span>
            </p>
            <p>
              <strong>名前:</strong> <span>{user.name}</span>
            </p>
            <p>
              <strong>メール:</strong> <span>{user.email}</span>
            </p>
            <p>
              <strong>役割:</strong> <span>{user.role}</span>
            </p>
          </div>
        )}
      </div>

      <div className="user-form-section">
        <h3>ユーザー情報編集・保存</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateUser({ id: userId, name, email, role });
          }}
        >
          <div className="input-group">
            <label htmlFor="name">名前:</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名前を入力してください"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">メールアドレス:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="メールアドレスを入力してください"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="role">役割:</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">ユーザー</option>
              <option value="admin">管理者</option>
              <option value="moderator">モデレーター</option>
            </select>
          </div>

          <div className="button-group">
            <button
              type="submit"
              disabled={saving || !name || !email}
              className="save-button"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>

      {/* 長いコンテンツ（スクロールテスト用） */}
      <div className="long-content-section">
        <h3>スクロールテスト用コンテンツ</h3>
        {Array.from({ length: 20 }).map((_, i) => (
          <p key={i}>これはスクロールテスト用のダミーコンテンツです。</p>
        ))}
        <p>ここが一番下だよ。</p>
      </div>
    </div>
  );
};
