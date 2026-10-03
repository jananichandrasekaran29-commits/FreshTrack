import { useEffect, useState } from "react";
import "./App.css";
import Login from "./Login";

function App() {
  // =========================
  // LOGIN
  // =========================
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  // =========================
  // FOOD DATA
  // =========================
  const [foods, setFoods] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    expiryDate: "",
  });

  const [search, setSearch] = useState("");
  const [editingFood, setEditingFood] = useState(null);

  // =========================
  // NOTIFICATIONS
  // =========================
  const [notificationStatus, setNotificationStatus] =
    useState("default");

  // =========================
  // USAGE HISTORY
  // =========================
  const [usageHistory, setUsageHistory] = useState(() => {
    try {
      const saved =
        localStorage.getItem("freshtrackUsageHistory");

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  // =========================
  // SMART SHOPPING LIST
  // =========================
  const [shoppingList, setShoppingList] = useState(() => {
    try {
      const saved = localStorage.getItem("freshtrackShoppingList");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
  };

  // =========================
  // GET FOODS
  // =========================
  const getFoods = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/foods"
      );

      const data = await response.json();

      setFoods(data);
    } catch (error) {
      console.log("Error fetching foods:", error);
    }
  };

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    if (!isLoggedIn) return;

    getFoods();

    if ("Notification" in window) {
      setNotificationStatus(Notification.permission);
    }
  }, [isLoggedIn]);

  // =========================
  // SAVE USAGE HISTORY
  // =========================
  useEffect(() => {
    localStorage.setItem(
      "freshtrackUsageHistory",
      JSON.stringify(usageHistory)
    );
  }, [usageHistory]);

  // =========================
  // SAVE SHOPPING LIST
  // =========================
  useEffect(() => {
    localStorage.setItem(
      "freshtrackShoppingList",
      JSON.stringify(shoppingList)
    );
  }, [shoppingList]);

  // =========================
  // STATUS
  // =========================
  const getStatus = (expiryDate, quantity) => {
    if (Number(quantity) <= 0) {
      return "Out of Stock";
    }

    const today = new Date();
    const expiry = new Date(expiryDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    const difference =
      (expiry - today) / (1000 * 60 * 60 * 24);

    if (difference < 0) {
      return "Expired";
    }

    if (difference <= 3) {
      return "Expiring Soon";
    }

    return "Fresh";
  };

  // =========================
  // DAYS LEFT
  // =========================
  const getDaysLeft = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil(
      (expiry - today) / (1000 * 60 * 60 * 24)
    );
  };

  // =========================
  // FORM CHANGE
  // =========================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // ADD FOOD
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter food name");
      return;
    }

    if (!formData.category.trim()) {
      alert("Please enter category");
      return;
    }

    if (
      !formData.quantity ||
      Number(formData.quantity) <= 0
    ) {
      alert("Please enter a valid quantity");
      return;
    }

    if (!formData.expiryDate) {
      alert("Please select expiry date");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/foods",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            quantity: Number(formData.quantity),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add food");
      }

      setFormData({
        name: "",
        category: "",
        quantity: "",
        expiryDate: "",
      });

      getFoods();
    } catch (error) {
      console.log(error);
      alert("Unable to add food");
    }
  };

  // =========================
  // EDIT
  // =========================
  const handleEdit = (food) => {
    setEditingFood({
      _id: food._id,
      name: food.name,
      category: food.category,
      quantity: food.quantity,
      expiryDate: food.expiryDate
        ? food.expiryDate.substring(0, 10)
        : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleEditChange = (e) => {
    setEditingFood({
      ...editingFood,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // UPDATE
  // =========================
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:5000/api/foods/${editingFood._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingFood.name,
            category: editingFood.category,
            quantity: Number(editingFood.quantity),
            expiryDate: editingFood.expiryDate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Update failed");
      }

      alert("Food updated successfully!");

      setEditingFood(null);

      getFoods();
    } catch (error) {
      console.log(error);
      alert("Unable to update food");
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================
  const cancelEdit = () => {
    setEditingFood(null);
  };

  // =========================
  // USE FOOD
  // =========================
  const handleUseFood = async (food) => {
    const currentQuantity = Number(food.quantity);

    if (currentQuantity <= 0) {
      alert("This food is already out of stock.");
      return;
    }

    const newQuantity = currentQuantity - 1;

    try {
      const response = await fetch(
        `http://localhost:5000/api/foods/${food._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: food.name,
            category: food.category,
            quantity: newQuantity,
            expiryDate: food.expiryDate,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update quantity");
      }

      const usageRecord = {
        id: Date.now(),
        foodName: food.name,
        category: food.category,
        quantityUsed: 1,
        date: new Date().toISOString(),
      };

      setUsageHistory((previous) => [
        usageRecord,
        ...previous,
      ]);

      getFoods();
    } catch (error) {
      console.log(error);
      alert("Unable to update food quantity");
    }
  };

  // =========================
  // DELETE
  // =========================
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this food item?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/foods/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      getFoods();
    } catch (error) {
      console.log(error);
      alert("Unable to delete food");
    }
  };

  // =========================
  // CLEAR HISTORY
  // =========================
  const clearUsageHistory = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear usage history?"
    );

    if (!confirmClear) return;

    setUsageHistory([]);
  };

  // =========================
  // SEARCH
  // =========================
  const filteredFoods = foods.filter(
    (food) =>
      food.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      food.category
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // =========================
  // DASHBOARD COUNTS
  // =========================
  const totalItems = foods.length;

  const freshItems = foods.filter(
    (food) =>
      getStatus(food.expiryDate, food.quantity) ===
      "Fresh"
  ).length;

  const expiringSoonItems = foods.filter(
    (food) =>
      getStatus(food.expiryDate, food.quantity) ===
      "Expiring Soon"
  ).length;

  const expiredItems = foods.filter(
    (food) =>
      getStatus(food.expiryDate, food.quantity) ===
      "Expired"
  ).length;

  const outOfStockItems = foods.filter(
    (food) =>
      getStatus(food.expiryDate, food.quantity) ===
      "Out of Stock"
  ).length;

  // =========================
  // QUANTITY
  // =========================
  const totalQuantity = foods.reduce(
    (total, food) =>
      total + Number(food.quantity),
    0
  );

  const totalUsedQuantity = usageHistory.reduce(
    (total, record) =>
      total + Number(record.quantityUsed),
    0
  );

  // =========================
  // WASTE
  // =========================
  const expiredFoods = foods.filter(
    (food) =>
      getStatus(food.expiryDate, food.quantity) ===
      "Expired"
  );

  const totalWasteQuantity = expiredFoods.reduce(
    (total, food) =>
      total + Number(food.quantity),
    0
  );

  const wastePercentage =
    totalQuantity > 0
      ? (
          (totalWasteQuantity / totalQuantity) *
          100
        ).toFixed(1)
      : 0;

  // =========================
  // USE SOON
  // =========================
  const useSoonFoods = foods
    .filter(
      (food) =>
        getStatus(food.expiryDate, food.quantity) !==
          "Expired" &&
        getStatus(food.expiryDate, food.quantity) !==
          "Out of Stock"
    )
    .sort(
      (a, b) =>
        new Date(a.expiryDate) -
        new Date(b.expiryDate)
    )
    .slice(0, 3);

  // ==================================================
  // 🤖 AI FOOD CONSUMPTION PREDICTION
  // ==================================================

  const getAIPrediction = (food) => {
    const foodUsage = usageHistory.filter(
      (record) =>
        record.foodName.toLowerCase() ===
        food.name.toLowerCase()
    );

    const totalUsed = foodUsage.reduce(
      (total, record) =>
        total + Number(record.quantityUsed),
      0
    );

    let usageScore = 0;

    // Usage history score
    if (totalUsed >= 5) {
      usageScore += 50;
    } else if (totalUsed >= 3) {
      usageScore += 35;
    } else if (totalUsed >= 1) {
      usageScore += 20;
    }

    // Quantity score
    if (Number(food.quantity) <= 1) {
      usageScore += 20;
    } else if (Number(food.quantity) <= 3) {
      usageScore += 10;
    }

    // Expiry score
    const daysLeft = getDaysLeft(
      food.expiryDate
    );

    if (daysLeft <= 1) {
      usageScore += 30;
    } else if (daysLeft <= 3) {
      usageScore += 25;
    } else if (daysLeft <= 7) {
      usageScore += 10;
    }

    let prediction;
    let recommendation;
    let confidence;

    if (daysLeft < 0) {
      prediction = "Expired";
      recommendation =
        "Do not consume. Remove from inventory.";
      confidence = 98;
    } else if (daysLeft <= 1) {
      prediction = "Very High Consumption";
      recommendation =
        "Use this food immediately.";
      confidence = 95;
    } else if (usageScore >= 60) {
      prediction = "High Consumption";
      recommendation =
        "This food is likely to be used quickly.";
      confidence = Math.min(
        95,
        70 + usageScore / 5
      );
    } else if (usageScore >= 35) {
      prediction = "Medium Consumption";
      recommendation =
        "Monitor this food and use it regularly.";
      confidence = Math.min(
        90,
        65 + usageScore / 5
      );
    } else {
      prediction = "Low Consumption";
      recommendation =
        "Consider using this food before expiry.";
      confidence = 70;
    }

    return {
      prediction,
      recommendation,
      confidence: Math.round(confidence),
      totalUsed,
      daysLeft,
    };
  };

  // ==================================================
  // 🛒 SMART SHOPPING LIST
  // ==================================================

  const addToShoppingList = (food) => {
    const alreadyAdded = shoppingList.some(
      (item) => item.foodId === food._id && !item.purchased
    );

    if (alreadyAdded) {
      alert(`${food.name} is already in your shopping list.`);
      return;
    }

    const newItem = {
      id: Date.now(),
      foodId: food._id,
      name: food.name,
      category: food.category,
      quantity: 1,
      purchased: false
    };

    setShoppingList((previous) => [
      ...previous,
      newItem
    ]);
  };

  const markAsPurchased = (id) => {
    setShoppingList((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              purchased: !item.purchased
            }
          : item
      )
    );
  };

  const removeFromShoppingList = (id) => {
    setShoppingList((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  const clearPurchasedItems = () => {
    setShoppingList((previous) =>
      previous.filter((item) => !item.purchased)
    );
  };

  // ==================================================
  // 🤖 AI WASTE PREDICTION
  // ==================================================

  const getWastePrediction = (food) => {
    const daysLeft = getDaysLeft(food.expiryDate);
    const quantity = Number(food.quantity) || 0;

    const foodUsage = usageHistory.filter(
      (record) =>
        record.foodName.toLowerCase() ===
        food.name.toLowerCase()
    );

    const totalUsed = foodUsage.reduce(
      (total, record) =>
        total + Number(record.quantityUsed),
      0
    );

    let riskScore = 0;

    // Expiry risk
    if (daysLeft < 0) {
      riskScore += 100;
    } else if (daysLeft <= 1) {
      riskScore += 70;
    } else if (daysLeft <= 3) {
      riskScore += 50;
    } else if (daysLeft <= 7) {
      riskScore += 25;
    }

    // Quantity risk
    if (quantity >= 5) {
      riskScore += 25;
    } else if (quantity >= 3) {
      riskScore += 15;
    } else if (quantity >= 1) {
      riskScore += 5;
    }

    // Usage history risk
    if (totalUsed === 0) {
      riskScore += 20;
    } else if (totalUsed <= 1) {
      riskScore += 10;
    }

    riskScore = Math.min(100, riskScore);

    let riskLevel;
    let recommendation;

    if (daysLeft < 0) {
      riskLevel = "Already Wasted";
      recommendation =
        "Remove this expired food from inventory.";
    } else if (riskScore >= 70) {
      riskLevel = "High Risk";
      recommendation =
        "Use this food immediately to avoid waste.";
    } else if (riskScore >= 40) {
      riskLevel = "Medium Risk";
      recommendation =
        "Plan to use this food soon.";
    } else {
      riskLevel = "Low Risk";
      recommendation =
        "Food is currently at low waste risk.";
    }

    return {
      riskLevel,
      riskScore,
      recommendation,
      daysLeft,
      totalUsed
    };
  };

  // =========================
  // CATEGORY ANALYTICS
  // =========================
  const categories = [
    ...new Set(
      foods.map((food) => food.category.trim())
    ),
  ];

  const categoryAnalytics = categories.map(
    (categoryName) => {
      const categoryFoods = foods.filter(
        (food) =>
          food.category.trim().toLowerCase() ===
          categoryName.toLowerCase()
      );

      const quantity = categoryFoods.reduce(
        (total, food) =>
          total + Number(food.quantity),
        0
      );

      const expiredQuantity = categoryFoods
        .filter(
          (food) =>
            getStatus(
              food.expiryDate,
              food.quantity
            ) === "Expired"
        )
        .reduce(
          (total, food) =>
            total + Number(food.quantity),
          0
        );

      const fresh = categoryFoods.filter(
        (food) =>
          getStatus(
            food.expiryDate,
            food.quantity
          ) === "Fresh"
      ).length;

      const expiringSoon = categoryFoods.filter(
        (food) =>
          getStatus(
            food.expiryDate,
            food.quantity
          ) === "Expiring Soon"
      ).length;

      const expired = categoryFoods.filter(
        (food) =>
          getStatus(
            food.expiryDate,
            food.quantity
          ) === "Expired"
      ).length;

      const outOfStock = categoryFoods.filter(
        (food) =>
          getStatus(
            food.expiryDate,
            food.quantity
          ) === "Out of Stock"
      ).length;

      return {
        name: categoryName,
        itemCount: categoryFoods.length,
        quantity,
        expiredQuantity,
        fresh,
        expiringSoon,
        expired,
        outOfStock,
      };
    }
  );

  // =========================
  // NOTIFICATIONS
  // =========================
  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      alert(
        "This browser does not support notifications."
      );
      return;
    }

    try {
      const permission =
        await Notification.requestPermission();

      setNotificationStatus(permission);

      if (permission === "granted") {
        new Notification(
          "FreshTrack Notifications Enabled 🔔",
          {
            body:
              "You will receive expiry reminders.",
          }
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // SMART REMINDERS
  // =========================
  const sendSmartReminders = () => {
    if (!("Notification" in window)) {
      alert(
        "This browser does not support notifications."
      );
      return;
    }

    if (Notification.permission !== "granted") {
      alert(
        "Please enable notifications first."
      );
      return;
    }

    const expired = foods.filter(
      (food) =>
        getStatus(
          food.expiryDate,
          food.quantity
        ) === "Expired"
    );

    const expiringSoon = foods.filter(
      (food) =>
        getStatus(
          food.expiryDate,
          food.quantity
        ) === "Expiring Soon"
    );

    if (expired.length > 0) {
      new Notification(
        "FreshTrack - Expired Food 🔴",
        {
          body:
            `${expired.length} food item(s) have expired.`,
        }
      );
    }

    if (expiringSoon.length > 0) {
      new Notification(
        "FreshTrack - Expiry Reminder 🟠",
        {
          body:
            `${expiringSoon.length} food item(s) are expiring soon.`,
        }
      );
    }

    if (
      expired.length === 0 &&
      expiringSoon.length === 0
    ) {
      new Notification(
        "FreshTrack - All Good! 🟢",
        {
          body:
            "No food items are expired or expiring soon.",
        }
      );
    }
  };

  // =========================
  // LOGIN PAGE
  // =========================
  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
      />
    );
  }

  // =========================
  // DASHBOARD
  // =========================
  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">

        <div>
          <h1>FreshTrack</h1>

          <p>
            Smart Food Expiry & Waste
            Reduction System
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="logout-button"
        >
          🚪 Logout
        </button>

      </header>

      <main className="container">

        {/* =========================
            DASHBOARD
        ========================= */}

        <section className="dashboard">

          <div className="dashboard-card total-card">
            <div className="dashboard-icon">
              📦
            </div>

            <div>
              <h3>Total Items</h3>
              <h2>{totalItems}</h2>
            </div>
          </div>

          <div className="dashboard-card fresh-card">
            <div className="dashboard-icon">
              🟢
            </div>

            <div>
              <h3>Fresh</h3>
              <h2>{freshItems}</h2>
            </div>
          </div>

          <div className="dashboard-card soon-card">
            <div className="dashboard-icon">
              🟠
            </div>

            <div>
              <h3>Expiring Soon</h3>
              <h2>{expiringSoonItems}</h2>
            </div>
          </div>

          <div className="dashboard-card expired-card">
            <div className="dashboard-icon">
              🔴
            </div>

            <div>
              <h3>Expired</h3>
              <h2>{expiredItems}</h2>
            </div>
          </div>

        </section>

        {/* =========================
            🤖 AI PREDICTION
        ========================= */}

        <section className="ai-section">

          <div className="section-heading">

            <div>
              <h2>
                🤖 AI Food Consumption Prediction
              </h2>

              <p>
                Smart predictions based on food
                usage, quantity and expiry data.
              </p>
            </div>

            <span className="ai-main-icon">
              🧠
            </span>

          </div>

          {foods.length === 0 ? (
            <div className="no-ai-data">
              🤖 Add food items to generate
              AI predictions.
            </div>
          ) : (
            <div className="ai-grid">

              {foods.map((food) => {

                const prediction =
                  getAIPrediction(food);

                return (
                  <div
                    className="ai-card"
                    key={food._id}
                  >

                    <div className="ai-card-header">

                      <div className="ai-food-info">

                        <span className="ai-food-icon">
                          🥗
                        </span>

                        <div>
                          <h3>
                            {food.name}
                          </h3>

                          <p>
                            {food.category}
                          </p>
                        </div>

                      </div>

                      <span className="ai-badge">
                        AI
                      </span>

                    </div>

                    <div className="ai-prediction">

                      <span className="ai-label">
                        Prediction
                      </span>

                      <h3>
                        {prediction.prediction}
                      </h3>

                    </div>

                    <div className="ai-details">

                      <div>
                        <span>
                          📦 Current Quantity
                        </span>

                        <strong>
                          {food.quantity}
                        </strong>
                      </div>

                      <div>
                        <span>
                          🍽️ Used
                        </span>

                        <strong>
                          {prediction.totalUsed}
                        </strong>
                      </div>

                      <div>
                        <span>
                          📅 Days Left
                        </span>

                        <strong>
                          {prediction.daysLeft < 0
                            ? "Expired"
                            : prediction.daysLeft}
                        </strong>
                      </div>

                    </div>

                    <div className="ai-confidence">

                      <div className="confidence-header">

                        <span>
                          Prediction Confidence
                        </span>

                        <strong>
                          {prediction.confidence}%
                        </strong>

                      </div>

                      <div className="confidence-bar">

                        <div
                          className="confidence-fill"
                          style={{
                            width: `${prediction.confidence}%`,
                          }}
                        ></div>

                      </div>

                    </div>

                    <div className="ai-recommendation">

                      <strong>
                        💡 AI Recommendation
                      </strong>

                      <p>
                        {prediction.recommendation}
                      </p>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

          <div className="ai-note">

            <span>🧠</span>

            <p>
              <strong>
                How does the prediction work?
              </strong>
              <br />
              FreshTrack analyzes food usage
              history, current quantity and
              expiry dates to generate a smart
              consumption prediction.
            </p>

          </div>

        </section>

        {/* =========================
            🛒 SMART SHOPPING LIST
        ========================= */}

        <section className="shopping-section">

          <div className="section-heading">

            <div>
              <h2>🛒 Smart Shopping List</h2>

              <p>
                Automatically identify low-stock
                and out-of-stock food items.
              </p>
            </div>

            <span className="shopping-main-icon">
              🛍️
            </span>

          </div>

          <div className="shopping-suggestions">

            <h3>💡 Smart Suggestions</h3>

            <div className="suggestion-grid">

              {foods
                .filter(
                  (food) =>
                    Number(food.quantity) <= 1
                )
                .map((food) => (

                  <div
                    className="suggestion-card"
                    key={food._id}
                  >

                    <div>
                      <strong>{food.name}</strong>

                      <span>
                        {food.category}
                      </span>

                      <small>
                        Current Stock:{" "}
                        {food.quantity}
                      </small>
                    </div>

                    <button
                      className="add-shopping-button"
                      onClick={() =>
                        addToShoppingList(food)
                      }
                    >
                      + Add
                    </button>

                  </div>

                ))}

              {foods.filter(
                (food) =>
                  Number(food.quantity) <= 1
              ).length === 0 && (

                <p className="no-suggestions">
                  ✅ No low-stock items right now.
                </p>

              )}

            </div>

          </div>

          <div className="shopping-list-container">

            <div className="shopping-list-title">

              <h3>📝 My Shopping List</h3>

              {shoppingList.some(
                (item) => item.purchased
              ) && (
                <button
                  className="clear-purchased-button"
                  onClick={clearPurchasedItems}
                >
                  🧹 Clear Purchased
                </button>
              )}

            </div>

            {shoppingList.length === 0 ? (

              <div className="empty-shopping">
                🛒 Your shopping list is empty.
              </div>

            ) : (

              <div className="shopping-list">

                {shoppingList.map((item) => (

                  <div
                    className={`shopping-item ${
                      item.purchased
                        ? "purchased"
                        : ""
                    }`}
                    key={item.id}
                  >

                    <div className="shopping-item-info">

                      <span className="shopping-check">
                        {item.purchased
                          ? "✅"
                          : "🛒"}
                      </span>

                      <div>
                        <h4>{item.name}</h4>

                        <p>
                          {item.category}
                        </p>
                      </div>

                    </div>

                    <div className="shopping-actions">

                      <button
                        className="purchase-button"
                        onClick={() =>
                          markAsPurchased(item.id)
                        }
                      >
                        {item.purchased
                          ? "Undo"
                          : "Mark Purchased"}
                      </button>

                      <button
                        className="remove-shopping-button"
                        onClick={() =>
                          removeFromShoppingList(
                            item.id
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </section>

        {/* =========================
            🤖 AI WASTE PREDICTION
        ========================= */}

        <section className="waste-prediction-section">

          <div className="section-heading">

            <div>
              <h2>🤖 AI Waste Prediction</h2>

              <p>
                Predict food waste risk using expiry,
                quantity and usage history.
              </p>
            </div>

            <span className="waste-ai-icon">
              🧠
            </span>

          </div>

          {foods.length === 0 ? (

            <div className="no-ai-data">
              🤖 Add food items to generate
              waste predictions.
            </div>

          ) : (

            <div className="waste-prediction-grid">

              {foods.map((food) => {

                const prediction =
                  getWastePrediction(food);

                return (

                  <div
                    className="waste-prediction-card"
                    key={food._id}
                  >

                    <div className="waste-card-header">

                      <div>
                        <h3>🥗 {food.name}</h3>

                        <p>
                          {food.category}
                        </p>
                      </div>

                      <span className="ai-badge">
                        AI
                      </span>

                    </div>

                    <div className="risk-display">

                      <span>Waste Risk</span>

                      <h2>
                        {prediction.riskScore}%
                      </h2>

                      <strong>
                        {prediction.riskLevel}
                      </strong>

                    </div>

                    <div className="risk-progress">

                      <div
                        className="risk-progress-fill"
                        style={{
                          width:
                            `${prediction.riskScore}%`
                        }}
                      ></div>

                    </div>

                    <div className="waste-details">

                      <div>
                        <span>📦 Quantity</span>
                        <strong>
                          {food.quantity}
                        </strong>
                      </div>

                      <div>
                        <span>📅 Days Left</span>
                        <strong>
                          {prediction.daysLeft < 0
                            ? "Expired"
                            : prediction.daysLeft}
                        </strong>
                      </div>

                      <div>
                        <span>🍽️ Used</span>
                        <strong>
                          {prediction.totalUsed}
                        </strong>
                      </div>

                    </div>

                    <div className="waste-recommendation">

                      <strong>
                        💡 AI Recommendation
                      </strong>

                      <p>
                        {prediction.recommendation}
                      </p>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </section>

        {/* =========================
            FOOD USAGE
        ========================= */}

        <section className="usage-summary-section">

          <div className="section-heading">

            <div>
              <h2>🍽️ Food Usage</h2>

              <p>
                Track the food items you
                have already used.
              </p>
            </div>

          </div>

          <div className="usage-summary-grid">

            <div className="usage-summary-card">
              <span>📦</span>

              <h3>Current Stock</h3>

              <strong>
                {totalQuantity}
              </strong>
            </div>

            <div className="usage-summary-card">
              <span>🍽️</span>

              <h3>Total Used</h3>

              <strong>
                {totalUsedQuantity}
              </strong>
            </div>

            <div className="usage-summary-card">
              <span>⚫</span>

              <h3>Out of Stock</h3>

              <strong>
                {outOfStockItems}
              </strong>
            </div>

          </div>

        </section>

        {/* =========================
            EDIT FOOD
        ========================= */}

        {editingFood && (
          <section className="edit-section">

            <div className="section-heading">

              <div>
                <h2>✏️ Edit Food</h2>

                <p>
                  Update your food details.
                </p>
              </div>

            </div>

            <form
              className="edit-form"
              onSubmit={handleUpdate}
            >

              <div className="form-group">

                <label>
                  Food Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={editingFood.name}
                  onChange={handleEditChange}
                />

              </div>

              <div className="form-group">

                <label>
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  value={editingFood.category}
                  onChange={handleEditChange}
                />

              </div>

              <div className="form-group">

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  name="quantity"
                  min="0"
                  value={editingFood.quantity}
                  onChange={handleEditChange}
                />

              </div>

              <div className="form-group">

                <label>
                  Expiry Date
                </label>

                <input
                  type="date"
                  name="expiryDate"
                  value={editingFood.expiryDate}
                  onChange={handleEditChange}
                />

              </div>

              <div className="edit-buttons">

                <button
                  type="submit"
                  className="save-button"
                >
                  💾 Save Changes
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={cancelEdit}
                >
                  ✖ Cancel
                </button>

              </div>

            </form>

          </section>
        )}

        {/* =========================
            ADD FOOD
        ========================= */}

        <section className="add-section">

          <div className="section-heading">

            <div>
              <h2>➕ Add Food</h2>

              <p>
                Add food items to track
                their expiry dates.
              </p>
            </div>

          </div>

          <form
            className="food-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>
                Food Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Example: Milk"
              />

            </div>

            <div className="form-group">

              <label>
                Category
              </label>

              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Example: Dairy"
              />

            </div>

            <div className="form-group">

              <label>
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Example: 3"
              />

            </div>

            <div className="form-group">

              <label>
                Expiry Date
              </label>

              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
              />

            </div>

            <button
              type="submit"
              className="add-button"
            >
              ➕ Add Food
            </button>

          </form>

        </section>

        {/* =========================
            REMINDERS
        ========================= */}

        <section className="reminder-section">

          <div className="section-heading">

            <div>
              <h2>
                🔔 Smart Expiry Reminders
              </h2>

              <p>
                Get notifications about
                food expiry.
              </p>
            </div>

          </div>

          <div className="reminder-control">

            <div className="reminder-control-text">

              <span className="reminder-icon">
                🔔
              </span>

              <div>

                <strong>
                  Notification Status
                </strong>

                <p>
                  {notificationStatus ===
                  "granted"
                    ? "Notifications are enabled."
                    : "Enable notifications to receive reminders."}
                </p>

              </div>

            </div>

            <div className="reminder-buttons">

              {notificationStatus !==
                "granted" && (
                <button
                  className="notification-button"
                  onClick={
                    enableNotifications
                  }
                >
                  🔔 Enable Notifications
                </button>
              )}

              <button
                className="reminder-test-button"
                onClick={
                  sendSmartReminders
                }
              >
                📢 Send Reminder
              </button>

            </div>

          </div>

        </section>

        {/* =========================
            WASTE
        ========================= */}

        <section className="waste-section">

          <div className="section-heading">

            <div>
              <h2>
                ♻️ Waste Reduction
              </h2>

              <p>
                Monitor food waste.
              </p>
            </div>

          </div>

          <div className="waste-grid">

            <div className="waste-card">

              <span>🗑️</span>

              <h3>
                Total Waste Quantity
              </h3>

              <strong>
                {totalWasteQuantity}
              </strong>

            </div>

            <div className="waste-card">

              <span>📊</span>

              <h3>
                Waste Percentage
              </h3>

              <strong>
                {wastePercentage}%
              </strong>

            </div>

            <div className="waste-card">

              <span>⚠️</span>

              <h3>
                Items at Risk
              </h3>

              <strong>
                {expiredItems +
                  expiringSoonItems}
              </strong>

            </div>

          </div>

          {expiredFoods.length > 0 ? (
            <div className="waste-list">

              <h3>
                Food Items Contributing
                to Waste
              </h3>

              {expiredFoods.map((food) => (
                <div
                  className="waste-item"
                  key={food._id}
                >

                  <div>
                    <strong>
                      {food.name}
                    </strong>

                    <p>
                      {food.category}
                    </p>
                  </div>

                  <span>
                    Quantity:{" "}
                    {food.quantity}
                  </span>

                </div>
              ))}

            </div>
          ) : (
            <div className="no-waste">
              🎉 No Food Waste Recorded
            </div>
          )}

        </section>

        {/* =========================
            CATEGORY ANALYTICS
        ========================= */}

        <section className="analytics-section">

          <div className="section-heading">

            <div>
              <h2>
                📊 Category-wise Food Analytics
              </h2>

              <p>
                Understand your food
                inventory by category.
              </p>
            </div>

          </div>

          {categoryAnalytics.length > 0 ? (
            <div className="category-grid">

              {categoryAnalytics.map(
                (category) => (
                  <div
                    className="category-card"
                    key={category.name}
                  >

                    <div className="category-card-header">

                      <div>

                        <span className="category-icon">
                          🥗
                        </span>

                        <h3>
                          {category.name}
                        </h3>

                      </div>

                      <span className="category-total">
                        {category.quantity}
                      </span>

                    </div>

                    <p>
                      {category.itemCount}
                      {" "}item(s)
                    </p>

                    <div className="category-status">

                      <span>
                        🟢 Fresh{" "}
                        {category.fresh}
                      </span>

                      <span>
                        🟠 Soon{" "}
                        {category.expiringSoon}
                      </span>

                      <span>
                        🔴 Expired{" "}
                        {category.expired}
                      </span>

                      {category.outOfStock >
                        0 && (
                        <span>
                          ⚫ Out{" "}
                          {category.outOfStock}
                        </span>
                      )}

                    </div>

                    {category.expiredQuantity >
                      0 && (
                      <div className="category-waste">
                        ⚠️ Waste Quantity:{" "}
                        {category.expiredQuantity}
                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="no-analytics">
              📊 Add food items to see
              analytics.
            </div>
          )}

        </section>

        {/* =========================
            USE SOON
        ========================= */}

        <section className="use-soon-section">

          <div className="section-heading">

            <div>
              <h2>
                🥕 Use Soon Recommendations
              </h2>

              <p>
                Foods with nearest
                expiry dates.
              </p>
            </div>

          </div>

          {useSoonFoods.length > 0 ? (
            <div className="use-soon-grid">

              {useSoonFoods.map(
                (food, index) => {

                  const daysLeft =
                    getDaysLeft(
                      food.expiryDate
                    );

                  return (
                    <div
                      className="use-soon-card"
                      key={food._id}
                    >

                      <div className="recommendation-number">
                        #{index + 1}
                      </div>

                      <div className="use-soon-card-content">

                        <div className="use-soon-food-header">

                          <span className="use-soon-icon">
                            🥗
                          </span>

                          <div>

                            <h3>
                              {food.name}
                            </h3>

                            <p>
                              {food.category}
                            </p>

                          </div>

                        </div>

                        <div className="use-soon-details">

                          <span>
                            Quantity:{" "}
                            {food.quantity}
                          </span>

                          <span>
                            {daysLeft <= 0
                              ? "Expires today"
                              : `${daysLeft} days left`}
                          </span>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          ) : (
            <div className="no-use-soon">
              🎉 No food items need
              to be used soon.
            </div>
          )}

        </section>

        {/* =========================
            USAGE HISTORY
        ========================= */}

        <section className="usage-history-section">

          <div className="section-heading">

            <div>
              <h2>
                🧾 Food Usage History
              </h2>

              <p>
                Track consumed food.
              </p>
            </div>

            {usageHistory.length > 0 && (
              <button
                className="clear-history-button"
                onClick={
                  clearUsageHistory
                }
              >
                🗑️ Clear History
              </button>
            )}

          </div>

          <div className="history-summary">

            <div className="history-total">

              <span>🍽️</span>

              <div>

                <p>
                  Total Food Used
                </p>

                <strong>
                  {totalUsedQuantity}
                </strong>

              </div>

            </div>

            <div className="history-total">

              <span>📝</span>

              <div>

                <p>
                  Usage Records
                </p>

                <strong>
                  {usageHistory.length}
                </strong>

              </div>

            </div>

          </div>

          {usageHistory.length === 0 ? (
            <div className="empty-history">

              🍽️ No food usage recorded yet.

              <p>
                Click "Use 1" to create
                a usage record.
              </p>

            </div>
          ) : (
            <div className="usage-history-list">

              {usageHistory.map(
                (record) => (
                  <div
                    className="usage-history-item"
                    key={record.id}
                  >

                    <div className="history-food-icon">
                      🍽️
                    </div>

                    <div className="history-food-info">

                      <h3>
                        {record.foodName}
                      </h3>

                      <p>
                        {record.category}
                      </p>

                    </div>

                    <div className="history-quantity">

                      <strong>
                        -{record.quantityUsed}
                      </strong>

                      <span>
                        Used
                      </span>

                    </div>

                    <div className="history-date">

                      {new Date(
                        record.date
                      ).toLocaleString()}

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

        {/* =========================
            ALERTS
        ========================= */}

        <section className="alerts-section">

          <div className="section-heading">

            <div>
              <h2>
                ⚠️ Expiry Alerts
              </h2>

              <p>
                Food items needing
                attention.
              </p>
            </div>

          </div>

          {expiredFoods.length > 0 && (
            <div className="alert-box expired-alert">

              <h3>
                🔴 Expired Items
              </h3>

              {expiredFoods.map(
                (food) => (
                  <div
                    className="alert-item"
                    key={food._id}
                  >

                    <strong>
                      {food.name}
                    </strong>

                    <span>
                      Expired on{" "}
                      {new Date(
                        food.expiryDate
                      ).toLocaleDateString()}
                    </span>

                  </div>
                )
              )}

            </div>
          )}

          {foods.filter(
            (food) =>
              getStatus(
                food.expiryDate,
                food.quantity
              ) === "Expiring Soon"
          ).length > 0 && (
            <div className="alert-box soon-alert">

              <h3>
                🟠 Expiring Soon
              </h3>

              {foods
                .filter(
                  (food) =>
                    getStatus(
                      food.expiryDate,
                      food.quantity
                    ) === "Expiring Soon"
                )
                .map(
                  (food) => (
                    <div
                      className="alert-item"
                      key={food._id}
                    >

                      <strong>
                        {food.name}
                      </strong>

                      <span>
                        {getDaysLeft(
                          food.expiryDate
                        )}{" "}
                        day(s) left
                      </span>

                    </div>
                  )
                )}

            </div>
          )}

          {foods.filter(
            (food) =>
              getStatus(
                food.expiryDate,
                food.quantity
              ) === "Out of Stock"
          ).length > 0 && (
            <div className="alert-box stock-alert">

              <h3>
                ⚫ Out of Stock
              </h3>

              {foods
                .filter(
                  (food) =>
                    getStatus(
                      food.expiryDate,
                      food.quantity
                    ) === "Out of Stock"
                )
                .map(
                  (food) => (
                    <div
                      className="alert-item"
                      key={food._id}
                    >

                      <strong>
                        {food.name}
                      </strong>

                      <span>
                        No quantity remaining
                      </span>

                    </div>
                  )
                )}

            </div>
          )}

        </section>

        {/* =========================
            INVENTORY
        ========================= */}

        <section className="food-list-section">

          <div className="section-heading">

            <div>
              <h2>
                🍎 Food Inventory
              </h2>

              <p>
                Search and manage food.
              </p>
            </div>

          </div>

          <div className="search-box">

            <input
              type="text"
              placeholder="🔍 Search food or category..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          {filteredFoods.length === 0 ? (
            <div className="no-foods">
              📦 No food items found.
            </div>
          ) : (
            <div className="food-grid">

              {filteredFoods.map(
                (food) => {

                  const status =
                    getStatus(
                      food.expiryDate,
                      food.quantity
                    );

                  return (
                    <div
                      className="food-card"
                      key={food._id}
                    >

                      <div className="food-card-header">

                        <div>

                          <h3>
                            {food.name}
                          </h3>

                          <p>
                            {food.category}
                          </p>

                        </div>

                        <span
                          className={`status-badge ${
                            status === "Fresh"
                              ? "fresh-badge"
                              : status ===
                                "Expiring Soon"
                              ? "soon-badge"
                              : status ===
                                "Expired"
                              ? "expired-badge"
                              : "stock-badge"
                          }`}
                        >
                          {status}
                        </span>

                      </div>

                      <div className="food-details">

                        <p>
                          <strong>
                            Quantity:
                          </strong>{" "}
                          {food.quantity}
                        </p>

                        <p>
                          <strong>
                            Expiry:
                          </strong>{" "}
                          {new Date(
                            food.expiryDate
                          ).toLocaleDateString()}
                        </p>

                        {status !==
                          "Expired" &&
                          status !==
                            "Out of Stock" && (
                          <p>
                            <strong>
                              Days Left:
                            </strong>{" "}
                            {getDaysLeft(
                              food.expiryDate
                            )}
                          </p>
                        )}

                      </div>

                      <div className="food-actions">

                        <button
                          className="edit-button"
                          onClick={() =>
                            handleEdit(food)
                          }
                        >
                          ✏️ Edit
                        </button>

                        <button
                          className="use-button"
                          onClick={() =>
                            handleUseFood(food)
                          }
                          disabled={
                            Number(
                              food.quantity
                            ) <= 0
                          }
                        >
                          ➖ Use 1
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(
                              food._id
                            )
                          }
                        >
                          🗑️ Delete
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </main>

      {/* FOOTER */}
      <footer className="footer">

        <p>
          © 2026 FreshTrack | Smart Food
          Expiry & Waste Reduction System
        </p>

      </footer>

    </div>
  );
}

export default App;