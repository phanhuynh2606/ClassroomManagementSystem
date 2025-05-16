import { useSelector } from 'react-redux';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4">
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.username}
            className="h-16 w-16 rounded-full"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-2xl text-gray-500">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.username}!
          </h2>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-sm text-gray-500 capitalize">Role: {user?.role}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">Your Dashboard</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Add your dashboard widgets/cards here */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900">Quick Stats</h4>
            <p className="mt-2 text-blue-700">Coming soon...</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900">Recent Activity</h4>
            <p className="mt-2 text-green-700">Coming soon...</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900">Notifications</h4>
            <p className="mt-2 text-purple-700">Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 