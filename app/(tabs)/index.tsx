import FloatingActionButton from "@/components/FloatingActionButton";
import TransactionModal from "@/components/TransactionModal";
import {
  CheckCircle,
  Circle,
  Clock,
  MinusCircle,
  PlusCircle,
  Target,
} from "lucide-react-native";
import { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function IncomeDashboard() {
  const [activeView, setActiveView] = useState("credit"); // 'credit' or 'debt'

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("income"); // 'income', 'expense', 'goal'

  // Categories state (global)
  const [categories, setCategories] = useState([
    "Salario",
    "Freelance",
    "Inversiones",
    "Comida",
    "Transporte",
    "Ropa",
    "Entretenimiento",
    "Servicios",
    "Salud",
    "Educación",
    "Hogar",
    "Otros",
  ]);

  // Datos de ejemplo - ahora como state para poder actualizarlos
  const [financialData, setFinancialData] = useState({
    credit: 15750.5,
    debt: -3200.75,
    creditTransactions: [
      {
        id: 1,
        description: "Salario",
        amount: 12000,
        date: "2024-08-01",
        category: "Salario",
      },
      {
        id: 2,
        description: "Freelance",
        amount: 2500,
        date: "2024-08-03",
        category: "Freelance",
      },
      {
        id: 3,
        description: "Inversiones",
        amount: 1250.5,
        date: "2024-08-05",
        category: "Inversiones",
      },
    ],
    debtTransactions: [
      {
        id: 1,
        description: "Tarjeta de crédito",
        amount: -1500,
        date: "2024-08-02",
        category: "Servicios",
      },
      {
        id: 2,
        description: "Préstamo personal",
        amount: -1200.75,
        date: "2024-08-04",
        category: "Otros",
      },
      {
        id: 3,
        description: "Servicios",
        amount: -500,
        date: "2024-08-05",
        category: "Servicios",
      },
    ],
  });

  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Ahorrar $10,000",
      current: 10000,
      target: 10000,
      status: "completed",
      category: "Ahorro",
    },
    {
      id: 2,
      title: "Pagar deuda tarjeta",
      current: 1500,
      target: 3000,
      status: "in-progress",
      category: "Deuda",
    },
    {
      id: 3,
      title: "Fondo de emergencia",
      current: 0,
      target: 5000,
      status: "pending",
      category: "Emergencia",
    },
    {
      id: 4,
      title: "Vacaciones",
      current: 2500,
      target: 8000,
      status: "in-progress",
      category: "Vacaciones",
    },
  ]);

  // Funciones para abrir el modal
  const handleAddIncome = () => {
    setModalType("income");
    setModalVisible(true);
  };

  const handleAddExpense = () => {
    setModalType("expense");
    setModalVisible(true);
  };

  const handleAddGoal = () => {
    setModalType("goal");
    setModalVisible(true);
  };

  type TransactionData = {
    type: "income" | "expense" | "goal";
    description?: string;
    amount: number;
    date: Date;
    category: string;
    target: number;
    status?: "completed" | "in-progress" | "pending";
  };

  // Función para añadir nueva categoría
  const handleAddCategory = (newCategory: string) => {
    if (!categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
  };

  // Función para guardar transacción/meta
  const handleSaveTransaction = (transactionData: TransactionData) => {
    if (transactionData.type === "income") {
      // Añadir ingreso
      const newTransaction = {
        id: Date.now(),
        description: transactionData.description || transactionData.category,
        amount: transactionData.amount,
        date: transactionData.date.toISOString().split("T")[0],
        category: transactionData.category,
      };

      setFinancialData((prev) => ({
        ...prev,
        credit: prev.credit + transactionData.amount,
        creditTransactions: [newTransaction, ...prev.creditTransactions],
      }));
    } else if (transactionData.type === "expense") {
      // Añadir egreso
      const newTransaction = {
        id: Date.now(),
        description: transactionData.description || transactionData.category,
        amount: -transactionData.amount, // Negativo para egresos
        date: transactionData.date.toISOString().split("T")[0],
        category: transactionData.category,
      };

      setFinancialData((prev) => ({
        ...prev,
        debt: prev.debt - transactionData.amount,
        debtTransactions: [newTransaction, ...prev.debtTransactions],
      }));
    } else if (transactionData.type === "goal") {
      // Añadir meta
      const newGoal = {
        id: Date.now(),
        title:
          transactionData.description || `Meta de ${transactionData.category}`,
        current: transactionData.amount,
        target: transactionData.target,
        status:
          transactionData.amount >= transactionData.target
            ? "completed"
            : transactionData.amount > 0
              ? "in-progress"
              : "pending",
        category: transactionData.category,
      };

      setGoals((prev) => [newGoal, ...prev]);
    }
  };

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return "text-green-600 dark:text-green-400";
    if (amount < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getBalanceBgColor = (amount: number) => {
    if (amount > 0)
      return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700/30";
    if (amount < 0)
      return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/30";
    return "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(Math.abs(amount));
  };

  const getGoalIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={20} color="#10b981" />;
      case "in-progress":
        return <Clock size={20} color="#f59e0b" />;
      default:
        return <Circle size={20} color="#6b7280" />;
    }
  };

  const getGoalProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const currentTransactions =
    activeView === "credit"
      ? financialData.creditTransactions
      : financialData.debtTransactions;

  const totalBalance = financialData.credit + financialData.debt;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard Financiero
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            Gestiona tus ingresos y deudas
          </Text>
        </View>

        {/* Balance Cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <PlusCircle size={20} color="#10b981" />
              <Text className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                Crédito
              </Text>
            </View>
            <Text
              className={`text-xl font-bold ${getBalanceColor(financialData.credit)}`}
            >
              {formatCurrency(financialData.credit)}
            </Text>
          </View>

          <View className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <MinusCircle size={20} color="#ef4444" />
              <Text className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                Deuda
              </Text>
            </View>
            <Text
              className={`text-xl font-bold ${getBalanceColor(financialData.debt)}`}
            >
              {formatCurrency(financialData.debt)}
            </Text>
          </View>
        </View>

        {/* Total Balance */}
        <View
          className={`rounded-xl p-4 mb-6 border-2 ${getBalanceBgColor(totalBalance)}`}
        >
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Balance Total
          </Text>
          <Text
            className={`text-3xl font-bold ${getBalanceColor(totalBalance)}`}
          >
            {totalBalance >= 0 ? "+" : ""}
            {formatCurrency(totalBalance)}
          </Text>
        </View>

        {/* View Toggle */}
        <View className="flex-row bg-white dark:bg-gray-800 rounded-xl p-1 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <TouchableOpacity
            onPress={() => setActiveView("credit")}
            className={`flex-1 py-3 px-4 rounded-lg ${
              activeView === "credit"
                ? "bg-green-500 dark:bg-green-600"
                : "bg-transparent"
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeView === "credit"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Ver Créditos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveView("debt")}
            className={`flex-1 py-3 px-4 rounded-lg ${
              activeView === "debt"
                ? "bg-red-500 dark:bg-red-600"
                : "bg-transparent"
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeView === "debt"
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Ver Deudas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <View className="p-4 border-b border-gray-100 dark:border-gray-700">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeView === "credit"
                ? "Ingresos Recientes"
                : "Deudas Pendientes"}
            </Text>
          </View>

          {currentTransactions.map((transaction, index) => (
            <View
              key={transaction.id}
              className={`p-4 flex-row justify-between items-center ${
                index < currentTransactions.length - 1
                  ? "border-b border-gray-50 dark:border-gray-700/50"
                  : ""
              }`}
            >
              <View className="flex-1">
                <Text className="font-medium text-gray-900 dark:text-white mb-1">
                  {transaction.description}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                    {new Date(transaction.date).toLocaleDateString("es-MX")}
                  </Text>
                  {transaction.category && (
                    <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      <Text className="text-xs text-gray-600 dark:text-gray-300">
                        {transaction.category}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text
                className={`text-lg font-bold ${
                  transaction.amount > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {transaction.amount > 0 ? "+" : ""}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Goals Section */}
        <View className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-20">
          <View className="p-4 border-b border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center">
              <Target size={24} color="#6366f1" />
              <Text className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
                Metas Financieras
              </Text>
            </View>
          </View>

          {goals.map((goal, index) => {
            const progress = getGoalProgress(goal.current, goal.target);

            return (
              <View
                key={goal.id}
                className={`p-4 ${
                  index < goals.length - 1
                    ? "border-b border-gray-50 dark:border-gray-700/50"
                    : ""
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    {getGoalIcon(goal.status)}
                    <View className="ml-2 flex-1">
                      <Text className="font-medium text-gray-900 dark:text-white">
                        {goal.title}
                      </Text>
                      {goal.category && (
                        <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full mt-1 self-start">
                          <Text className="text-xs text-blue-600 dark:text-blue-400">
                            {goal.category}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(goal.current)} /{" "}
                    {formatCurrency(goal.target)}
                  </Text>
                </View>

                <View className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${
                      goal.status === "completed"
                        ? "bg-green-500 dark:bg-green-400"
                        : goal.status === "in-progress"
                          ? "bg-yellow-500 dark:bg-yellow-400"
                          : "bg-gray-400 dark:bg-gray-500"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </View>

                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {progress.toFixed(1)}% completado
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
        onAddGoal={handleAddGoal}
      />

      {/* Transaction Modal */}
      {modalVisible && (
        <TransactionModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveTransaction}
          type={modalType}
          categories={categories}
          onAddCategory={handleAddCategory}
        />
      )}
    </SafeAreaView>
  );
}
