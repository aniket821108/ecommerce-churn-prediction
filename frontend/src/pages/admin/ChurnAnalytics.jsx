import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import Loader from '../../components/common/Loader';

const ChurnAnalytics = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['churnPredictions'],
    queryFn: () => adminService.getChurnPredictions(),
  });

  const predictions = data?.data?.predictions || [];
  const users = data?.data?.users || [];

  if (isLoading) return <Loader />;
  if (error) return <div className="text-center py-10 text-red-500">Failed to load churn predictions</div>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Churn Prediction Analytics</h2>
      <p className="text-gray-600 mb-6">
        AI-powered predictions identifying customers at risk of churning.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">High Risk Customers</h3>
          <p className="text-3xl font-bold text-red-600">
            {predictions.filter(p => p.churnRisk === 'high').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">Medium Risk Customers</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {predictions.filter(p => p.churnRisk === 'medium').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500 mb-1">Low Risk Customers</h3>
          <p className="text-3xl font-bold text-green-600">
            {predictions.filter(p => p.churnRisk === 'low').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Probability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Order
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {predictions.map((pred, idx) => {
              const user = users[idx];
              return (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      pred.churnRisk === 'high' ? 'bg-red-100 text-red-800' :
                      pred.churnRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {pred.churnRisk}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(pred.probability * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pred.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user?.daysSinceLastOrder ? `${user.daysSinceLastOrder} days ago` : 'Never'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChurnAnalytics;