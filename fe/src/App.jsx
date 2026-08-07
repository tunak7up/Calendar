import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { SplashScreen } from "@capacitor/splash-screen";
import { useAuth } from "./context/AuthContext";
import HeaderPage from "./layouts/HeaderPage";
import SidebarRegister from "./layouts/SidebarRegister";
import RegistrationHistory from "./pages/user/RegistrationHistory";
import RegistrationHistoryDetails from "./pages/user/RegistrationHistoryDetails";
import RegisterWork from "./pages/user/RegisterWork";
import RegisterLeave from "./pages/user/RegisterLeave";
import RegisterException from "./pages/user/RegisterException";
import MySchedule from "./pages/user/MySchedule";
import Login from "./pages/auth/Login";
import SidebarTask from "./layouts/SidebarTask";
import AddTask from "./pages/tasks/AddTask";
import TaskList from "./pages/tasks/TaskList";
import AddSubTask from "./pages/tasks/AddSubTask";
import TaskDetails from "./pages/tasks/TaskDetails";
import SidebarAdmin from "./layouts/SidebarAdmin";
import SidebarThemeSettings from "./layouts/SidebarThemeSettings";
import AdminEmployeeList from "./pages/admin/AdminEmployeeList";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminWorkHours from "./pages/admin/AdminWorkHours";
import Profile from "./pages/user/Profile";
import Dashboard from "./pages/user/Dashboard";
import ReportHistory from "./pages/user/ReportHistory";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReportHistory from "./pages/admin/AdminReportHistory";
import AdminPresetReasons from "./pages/admin/AdminPresetReasons";
import AdminThemeSettings from "./pages/admin/AdminThemeSettings";
import AdminAiAgents from "./pages/admin/AdminAiAgents";

import "./styles/App.css";

import MainLayout from "./layouts/MainLayout";
import {
  saveAuthRedirect,
  clearAuthRedirect,
  getAuthRedirect,
  getDefaultRedirectPath,
} from "./utils/authRedirect";
import { apiFetch } from "./services/api";
import { Capacitor } from "@capacitor/core";
import OneSignalNative from "@onesignal/capacitor-plugin";

function App() {
  const { isLoggedIn, isAdmin, isLoading, isLoggingOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide Splash Screen once loading is complete
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hide().catch(() => {});
    }
  }, [isLoading]);

  // Initialize OneSignal and register device Subscription ID
  useEffect(() => {
    if (!isLoggedIn || !user?.person_id) return;

    let active = true;
    let webCleanup = null;

    const initOneSignal = async () => {
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        try {
          // Initialize native plugin
          await OneSignalNative.initialize(
            import.meta.env.VITE_ONESIGNAL_APP_ID,
          );

          // Request permission
          await OneSignalNative.Notifications.requestPermission(true);

          // Display push notifications in foreground
          OneSignalNative.Notifications.addEventListener(
            "foregroundWillDisplay",
            (event) => {
              console.log(
                "[OneSignal Native] Foreground notification received:",
                event.getNotification(),
              );
            },
          );

          // Helper: gửi subscription ID lên backend
          const sendSubscriptionToBackend = async (subscriptionId) => {
            if (!subscriptionId || !active) return;
            console.log("[OneSignal Native] Sending Registration ID:", subscriptionId);
            localStorage.setItem("onesignal_id", subscriptionId);
            await apiFetch(`/person/${user.person_id}/onesignal`, {
              method: "POST",
              body: JSON.stringify({ onesignal_id: subscriptionId }),
            }).catch((e) =>
              console.error(
                "[OneSignal Native] Failed to send subscription ID to backend:",
                e,
              ),
            );
          };

          // Cách 1: Lắng nghe khi FCM đăng ký xong (subscription thay đổi)
          // Đây là cách đáng tin cậy nhất vì FCM có thể mất vài giây
          OneSignalNative.User.pushSubscription.addObserver(async (subscription) => {
            const newId = subscription.current?.id;
            if (newId) {
              console.log("[OneSignal Native] Subscription changed, new ID:", newId);
              await sendSubscriptionToBackend(newId);
            }
          });

          // Cách 2: Thử lấy ngay lập tức (phòng trường hợp đã có sẵn)
          const subscriptionId =
            await OneSignalNative.User.pushSubscription.getIdAsync();
          if (subscriptionId) {
            await sendSubscriptionToBackend(subscriptionId);
          } else {
            console.log("[OneSignal Native] No subscription ID yet, waiting for FCM registration...");
          }

          // Link external ID to matching person ID
          await OneSignalNative.login(String(user.person_id));
        } catch (e) {
          console.error("[OneSignal Native] Error initializing:", e);
        }
      } else {
        // Web browser environment
        const script = document.createElement("script");
        script.src =
          "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
        script.defer = true;

        script.onload = () => {
          if (!active) return;
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          window.OneSignalDeferred.push(async function (OneSignal) {
            await OneSignal.init({
              appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
              notifyButton: {
                enable: false,
              },
            });

            try {
              // Request permission
              await OneSignal.Notifications.requestPermission();

              // Display push notifications in foreground
              OneSignal.Notifications.addEventListener(
                "foregroundWillDisplay",
                (event) => {
                  console.log(
                    "[OneSignal Web] Foreground notification received:",
                    event.getNotification(),
                  );
                },
              );

              const subscriptionId = OneSignal.User.PushSubscription.id;
              if (subscriptionId && active) {
                console.log("[OneSignal Web] Registration ID:", subscriptionId);
                localStorage.setItem("onesignal_id", subscriptionId);
                await apiFetch(`/person/${user.person_id}/onesignal`, {
                  method: "POST",
                  body: JSON.stringify({ onesignal_id: subscriptionId }),
                }).catch((e) =>
                  console.error(
                    "[OneSignal Web] Failed to send subscription ID to backend:",
                    e,
                  ),
                );
              }

              // Listen for subscription change events
              OneSignal.User.PushSubscription.addEventListener(
                "change",
                async (event) => {
                  const newId = event.current.id;
                  if (newId && active) {
                    console.log(
                      "[OneSignal Web] Subscription ID changed:",
                      newId,
                    );
                    localStorage.setItem("onesignal_id", newId);
                    await apiFetch(`/person/${user.person_id}/onesignal`, {
                      method: "POST",
                      body: JSON.stringify({ onesignal_id: newId }),
                    }).catch((e) =>
                      console.error(
                        "[OneSignal Web] Failed to send updated subscription ID to backend:",
                        e,
                      ),
                    );
                  }
                },
              );
            } catch (e) {
              console.error(
                "[OneSignal Web] Error initializing or requesting permissions:",
                e,
              );
            }
          });
        };

        document.head.appendChild(script);

        webCleanup = () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      }
    };

    initOneSignal();

    return () => {
      active = false;
      if (webCleanup) webCleanup();
    };
  }, [isLoggedIn, user?.person_id]);

  // Redirect to login if not logged in
  useEffect(() => {
    if (
      !isLoading &&
      !isLoggingOut &&
      !isLoggedIn &&
      location.pathname !== "/login"
    ) {
      const fullPath = `${location.pathname}${location.search}${location.hash}`;
      saveAuthRedirect(fullPath);
      navigate("/login", { state: { from: fullPath }, replace: true });
    }
  }, [
    isLoggedIn,
    isLoading,
    isLoggingOut,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

  // Hiện loading khi đang kiểm tra auth hoặc đang đăng xuất
  if (isLoading || isLoggingOut) {
    return (
      <div className="fixed inset-0 bg-gray-200 z-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056b3]"></div>
        <p className="mt-4 text-[#0056b3] font-bold tracking-tight">
          Đang tải...
        </p>
      </div>
    );
  }

  if (!isLoggedIn && location.pathname !== "/login") {
    return null;
  }

  const isTaskPath = location.pathname.startsWith("/tasks");
  const isAdminPath = location.pathname.startsWith("/admin");
  const isRegisterPath =
    location.pathname.startsWith("/register") ||
    location.pathname === "/history" ||
    location.pathname.startsWith("/history/");

  const renderSidebar = () => {
    if (
      location.pathname === "/schedule" ||
      location.pathname === "/admin/schedule" ||
      location.pathname === "/dashboard" ||
      location.pathname === "/admin/dashboard"
    ) {
      return null;
    }

    // Admin pages with only 1 sidebar item — don't show sidebar
    const singleItemAdminPaths = [
      "/admin/employees",
      "/admin/requests",
      "/admin/work-hours",
      "/admin/reports",
      "/admin/preset-reasons",
      "/admin/ai-agents",
    ];
    if (isAdmin && singleItemAdminPaths.includes(location.pathname)) {
      return null;
    }

    if (isAdmin && location.pathname === "/admin/theme-settings") {
      return <SidebarThemeSettings />;
    }

    if (isAdmin && isAdminPath) {
      return <SidebarAdmin activeItem={location.pathname} />;
    }

    if (isTaskPath) {
      return <SidebarTask activeItem={location.pathname} />;
    }

    if (isRegisterPath) {
      return isAdmin ? null : (
        <SidebarRegister activeItem={location.pathname} />
      );
    }

    return null;
  };

  const sidebar = renderSidebar();
  const hasSidebar = !!sidebar;
  const isCalendarPage =
    location.pathname === "/schedule" ||
    location.pathname === "/admin/schedule";

  return (
    <div className="antialiased bg-gray-200 min-h-screen flex flex-col">
      {location.pathname !== "/login" && (
        <HeaderPage activeItem={location.pathname} isAdmin={isAdmin} />
      )}

      {sidebar}

      {location.pathname === "/login" ? (
        <main className="flex-1">
          <Routes>
            <Route
              path="/login"
              element={
                <Login
                  onLogin={(data) => {
                    const stateFrom = location.state?.from;
                    const redirectTo =
                      stateFrom ||
                      getAuthRedirect() ||
                      getDefaultRedirectPath(data.user);
                    clearAuthRedirect();
                    navigate(redirectTo, { replace: true });
                  }}
                />
              }
            />
          </Routes>
        </main>
      ) : (
        <MainLayout
          hasSidebar={hasSidebar}
          maxWidth={isCalendarPage ? "max-w-full" : "max-w-7xl"}
        >
          <Routes>
            {/* User Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schedule" element={<MySchedule />} />
            <Route path="/register/work" element={<RegisterWork />} />
            <Route path="/register/leave" element={<RegisterLeave />} />
            <Route path="/register/exception" element={<RegisterException />} />
            <Route path="/history" element={<RegistrationHistory />} />
            <Route
              path="/history/:id"
              element={<RegistrationHistoryDetails />}
            />
            <Route path="/reports" element={<ReportHistory />} />

            <Route path="/tasks" element={<TaskList isAdmin={isAdmin} />} />
            <Route path="/tasks/add" element={<AddTask />} />
            <Route path="/tasks/:id" element={<TaskDetails />} />
            <Route path="/tasks/sub-add/:parentId" element={<AddSubTask />} />

            {/* Profile Routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                isAdmin ? <AdminDashboard /> : <Navigate to="/schedule" />
              }
            />
            <Route
              path="/admin/employees"
              element={
                isAdmin ? <AdminEmployeeList /> : <Navigate to="/schedule" />
              }
            />
            <Route
              path="/admin/requests"
              element={
                isAdmin ? <AdminRequests /> : <Navigate to="/schedule" />
              }
            />
            <Route
              path="/admin/schedule"
              element={
                isAdmin ? <AdminSchedule /> : <Navigate to="/schedule" />
              }
            />
            <Route
              path="/admin/work-hours"
              element={
                isAdmin ? <AdminWorkHours /> : <Navigate to="/schedule" />
              }
            />
            <Route
              path="/admin/reports"
              element={
                isAdmin ? <AdminReportHistory /> : <Navigate to="/schedule" />
              }
            />
            <Route
              path="/admin/preset-reasons"
              element={
                isAdmin ? <AdminPresetReasons /> : <Navigate to="/schedule" />
              }
            />
            <Route
              path="/admin/theme-settings"
              element={
                isAdmin ? <AdminThemeSettings /> : <Navigate to="/schedule" />
              }
            />
            <Route
              path="/admin/ai-agents"
              element={
                isAdmin ? <AdminAiAgents /> : <Navigate to="/schedule" />
              }
            />

            {/* Redirects */}
            <Route
              path="/"
              element={
                <Navigate
                  to={
                    isLoggedIn
                      ? isAdmin
                        ? "/admin/dashboard"
                        : "/dashboard"
                      : "/login"
                  }
                />
              }
            />
          </Routes>
        </MainLayout>
      )}
    </div>
  );
}

export default App;
