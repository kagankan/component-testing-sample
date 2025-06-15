import { useState, useEffect, useCallback } from "react";
import "./style.css";
import { useMobile } from "./hooks";
import { formTitle } from "./sample-module";
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserProfileFormProps {
  userId: number;

  /**
   * API エラー発生時のコールバック
   */
  onError?: (error: string) => void;
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

        if (isMounted) {
          if (response.ok) {
            const fetchedUser = await response.json();
            setUser(fetchedUser);
          } else {
            const errorMessage = await response.json();
            onError?.(errorMessage.message);
          }
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "ユーザー情報の取得に失敗しました";
          onError?.(errorMessage);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [onError, userId]);

  // ユーザー情報を保存
  const updateUser = useCallback(
    async ({ id, ...userData }: User) => {
      try {
        setSaving(true);
        const response = await fetch(`/api/users/${id}`, {
          method: "PUT",
          body: JSON.stringify(userData),
        });
        if (response.ok) {
          const fetchedUser = await response.json();
          setUser(fetchedUser);
        } else {
          const errorMessage = await response.json();
          onError?.(errorMessage.message);
        }
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

      {isMobile && (
        <div className="mobile-only">
          これは画面が狭いときだけ表示されるはずだよ
        </div>
      )}

      <div className="user-fetch-section">
        <h3>ユーザー情報取得</h3>

        <div className="user-info">
          <p>
            <strong>ID:</strong> <span>{user?.id}</span>
          </p>
          <p>
            <strong>名前:</strong> <span>{user?.name}</span>
          </p>
          <p>
            <strong>メール:</strong> <span>{user?.email}</span>
          </p>
          <p>
            <strong>役割:</strong> <span>{user?.role}</span>
          </p>
        </div>
      </div>

      <div className="user-form-section">
        <h3>ユーザー情報更新</h3>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) {
              window.alert("名前を入力してください");
              return;
            }
            if (!email) {
              window.alert("メールアドレスを入力してください");
              return;
            }
            updateUser({ id: userId, name, email, role });
          }}
        >
          <div className="input-group">
            <label htmlFor="name">名前</label>
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
            <label htmlFor="email">メールアドレス</label>
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
            <label htmlFor="role">役割</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="viewer">閲覧者</option>
              <option value="admin">管理者</option>
            </select>
          </div>

          <div className="button-group">
            <button type="submit" disabled={saving} className="save-button">
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
