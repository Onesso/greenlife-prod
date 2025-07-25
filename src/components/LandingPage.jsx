import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { clearAuth } from './store/authSlice';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  FaUserTie,
  FaStore,
  FaMoneyBill,
  FaBoxOpen,
  FaMapMarkedAlt,
  FaMapMarkerAlt,
  FaBars,
  FaEye,
  FaChartLine,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import '../styles/landingpage.css';

const mainMenuItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <FaChartLine />,
    subItems: [{ key: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> }]
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    icon: <FaUserTie />,
    subItems: [
      { key: 'agents', label: 'Agents', icon: <FaUserTie /> },
      { key: 'distributors', label: 'Dealers', icon: <FaStore /> }
    ]
  },
  {
    key: 'regionOnboarding',
    label: 'Region Onboarding',
    icon: <FaUserTie />,
    subItems: [
      { key: 'regionAgents', label: 'Agents', icon: <FaUserTie /> },
      { key: 'regionDistributors', label: 'Dealers', icon: <FaStore /> }
    ]
  },
  {
    key: 'regionSales',
    label: 'Region Sales',
    icon: <FaMoneyBill />,
    subItems: [
      { key: 'reports', label: 'Sales', icon: <FaChartLine /> },
      { key: 'groupedSales', label: 'Commisions', icon: <FaChartLine /> }
    ]
  },
  {
    key: 'sales',
    label: 'Sales',
    icon: <FaMoneyBill />,
    subItems: [
      { key: 'reports', label: 'Sales', icon: <FaChartLine /> }
    ]
  },
  {
    key: 'commissionMenu',
    label: 'Commission',
    icon: <FaMoneyBill />,
    subItems: [
      { key: 'commissionDisbursement', label: 'Commission Disbursement', icon: <FaMoneyBill /> },
      // { key: 'paidCommissions', label: 'Paid Commissions', icon: <FaMoneyBill /> }
    ]
  },
  {
    key: 'accessManagement',
    label: 'Access Management',
    icon: <FaEye />,
    subItems: [
      { key: 'user', label: 'User', icon: <FaUserTie /> },
      { key: 'group', label: 'Group', icon: <FaStore /> }
    ]
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <FaBoxOpen />,
    subItems: [
      { key: 'regions', label: 'Regions', icon: <FaMapMarkedAlt /> },
      { key: 'subRegions', label: 'Areas', icon: <FaMapMarkerAlt /> },
      { key: 'products', label: 'Products', icon: <FaBoxOpen /> },
      { key: 'profile', label: 'Profile', icon: <FaUserTie /> }
    ]
  }
];

function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const sidebarRef = useRef(null);

  const getRoutePath = (mainKey, subKey) => {
    if (mainKey === 'dashboard') return '/landingpage/dashboard';
    if (mainKey === 'onboarding'){
      if (subKey === 'agents') return '/landingpage/agents';
      if (subKey === 'distributors') return '/landingpage/distributors';
    }
    if (mainKey === 'regionOnboarding'){
      if (subKey === 'regionAgents') return '/landingpage/region-agents';
      if (subKey === 'regionDistributors') return '/landingpage/region-distributors';
    }
    if (mainKey === 'settings'){
      if (subKey === 'regions') return '/landingpage/regions';
      if (subKey === 'subRegions') return '/landingpage/sub-regions';
      if (subKey === 'products') return '/landingpage/products';
      if (subKey === 'profile') return '/landingpage/profile';
    }
    if (mainKey === 'regionSales'){
      if (subKey === 'reports') return '/landingpage/region-sales';
      if (subKey === 'groupedSales') return '/landingpage/grouped-sales';
    }
    if (mainKey === 'sales'){
      if (subKey === 'reports') return '/landingpage/sales';
    }
    if (mainKey === 'commissionMenu'){
      if (subKey === 'commissionDisbursement') return '/landingpage/commission-disbursement';
      if (subKey === 'paidCommissions') return '/landingpage/paid-commissions';
    }
    if (mainKey === 'accessManagement'){
      if (subKey === 'user') return '/landingpage/user';
      if (subKey === 'group') return '/landingpage/group';
    }
    return '/landingpage/dashboard';
  };

  const isSubItemActive = (mainKey, subKey) => {
    return location.pathname.startsWith(getRoutePath(mainKey, subKey));
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const groupData = JSON.parse(localStorage.getItem('groupData') || '{}');
  const permissions = groupData.permissions || {};
  const groupName = (groupData.groupName || '').trim().toLowerCase();

  const filteredMenuItems = mainMenuItems.filter((item) => {
    const keyLower = item.key.toLowerCase();
    if (keyLower === 'onboarding' || keyLower === 'sales') {
      return groupName === 'admin';
    } else if (keyLower === 'regiononboarding' || keyLower === 'regionsales') {
      return groupName === 'regional managers';
    }
    return true;
  });

  const menuPermissionMapping = {
    dashboard: null,
    agents: 'readAgent',
    distributors: 'readDistributor',
    regionalManagers: 'readRegionManager',
    subRegionalManagers: 'readSubRegion',
    regions: 'readRegion',
    subRegions: 'readSubRegion',
    products: 'readProduct',
    commission: 'readCommission',
    reports: 'viewSales',
    groupedSales: 'viewSales',
    commissionDisbursement: 'readCommission',
    paidCommissions: 'viewPaidCommissions',
    user: 'viewUser',
    group: 'readGroup'
  };

  const handleSignOut = () => {
    dispatch(clearAuth());
    navigate('/');
  };

  const handleMainMenuClick = (mainItem) => {
    if (mainItem.subItems && mainItem.subItems.length > 0) {
      setOpenDropdowns((prev) => ({
        ...prev,
        [mainItem.key]: !prev[mainItem.key]
      }));
    } else {
      const routePath = getRoutePath(mainItem.key, mainItem.key);
      navigate(routePath);
    }
  };

  const handleSubItemClick = (mainKey, subKey) => {
    const routePath = getRoutePath(mainKey, subKey);
    navigate(routePath);
    if (window.innerWidth < 780) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (window.innerWidth < 780 && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpenDropdowns({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="landing-page">
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Sidebar Navigation"
            >
              <FaBars />
            </button>
            <h1 className="logo">GreenLife</h1>
          </div>
          <div className="header-right">
            <nav className="top-nav" aria-label="Main Navigation">
              <button type="button" className="sign-out-button" onClick={handleSignOut}>
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </header>
      <div className="main-container">
        <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Sidebar Navigation">
          {filteredMenuItems.map((mainItem) => {
            let filteredSubItems = [];
            if (mainItem.subItems && mainItem.subItems.length > 0) {
              filteredSubItems = mainItem.subItems.filter((subItem) => {
                const requiredPermission = menuPermissionMapping[subItem.key];
                return requiredPermission ? permissions[requiredPermission] : true;
              });
              if (filteredSubItems.length === 0) return null;
            }
            const activeInMenu = mainItem.subItems && mainItem.subItems.some(sub => isSubItemActive(mainItem.key, sub.key));
            const showSubMenu = openDropdowns[mainItem.key];
            return (
              <div key={mainItem.key} className="menu-section">
                {mainItem.subItems && mainItem.subItems.length > 0 ? (
                  <>
                    <div
                      className={`menu-title ${(!showSubMenu && activeInMenu) ? 'active' : ''}`}
                      onClick={() => handleMainMenuClick(mainItem)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span>
                        <span className="menu-icon">{mainItem.icon}</span>
                        <span className="menu-label">{mainItem.label}</span>
                      </span>
                      <span className="dropdown-indicator">
                        {showSubMenu ? <FaChevronUp /> : <FaChevronDown />}
                      </span>
                    </div>
                    {showSubMenu && (
                      <ul className="sub-menu">
                        {filteredSubItems.map((subItem) => (
                          <li key={subItem.key} className="sub-menu-item">
                            <button
                              type="button"
                              className={`action-button ${isSubItemActive(mainItem.key, subItem.key) ? 'active' : ''}`}
                              onClick={() => handleSubItemClick(mainItem.key, subItem.key)}
                            >
                              <span className="action-icon">{subItem.icon}</span>
                              <span className="action-label">{subItem.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className={`action-button ${isSubItemActive(mainItem.key, mainItem.key) ? 'active' : ''}`}
                    onClick={() => handleSubItemClick(mainItem.key, mainItem.key)}
                  >
                    <span className="action-icon">{mainItem.icon}</span>
                    <span className="action-label">{mainItem.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </aside>
        <main className="content" aria-label="Main Content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function withSessionTimeout(Component) {
  return function WrappedComponent(props) {
    const accessToken = useSelector((state) => state.auth.accessToken);
    const navigate = useNavigate();
    useEffect(() => {
      if (!accessToken) {
        navigate('/');
      }
    }, [accessToken, navigate]);
    return <Component {...props} />;
  };
}

export default withSessionTimeout(LandingPage);
