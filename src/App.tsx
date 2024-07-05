import { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";

import { Table, Dropdown, Button, Input } from "./components";
import FoodForm from "./components/Forms/FoodForm";
import { addFood, api, fetchFood, Food, LIST_FOOD } from "./graphql";

import "./App.css";

type SortingCriteria = Exclude<keyof Food, "name">;
type SortingOrder = "asc" | "desc";

const App = (): JSX.Element => {
  const [foodData, setFoodData] = useState<Food[]>([]);
  const [sortKey, setSortKey] = useState<SortingCriteria>("id");
  const [sortOrder, setSortOrder] = useState<SortingOrder>("asc");
  const [searchValue, setSearchValue] = useState<string>("");

  useEffect(() => {
    getFood();
  }, []);

  async function getFood() {
    try {
      const foodData: Food[] = await fetchFood();
      setFoodData(foodData);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Unable to fetch food`);
        console.error("Error in fetch:", error.message);
      }
    }
  }

  const food: Food[] = useMemo(() => {
    const returnValue = sortOrder === "desc" ? 1 : -1;

    return [
      ...[...foodData].sort((a, b) => {
        return a[sortKey] > b[sortKey] ? -returnValue : returnValue;
      }),
    ];
  }, [foodData, sortKey, sortOrder]);

  const filteredFood: Food[] = useMemo(
    () =>
      food.filter((foodItem) =>
        Object.values(foodItem).join("").includes(searchValue)
      ),
    [searchValue, food]
  );

  // TODO: add debounce to reduce unnecessary renders
  const search = (search: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchValue(search.target.value);
  };

  const sort = (key: string): void => {
    setSortKey(key as SortingCriteria);
  };

  const flipOrder = (): void => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const submit = async (food: Food): Promise<void> => {
    try {
      await addFood(food);
      const foodData = await api.refetchQueries({
        include: [
          {
            // @ts-expect-error: https://github.com/apollographql/apollo-client/issues/5419#issuecomment-598065442
            query: LIST_FOOD,
          },
        ],
      });
      setFoodData(foodData[0].data.food);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Unable to add food`);
        console.error("Error in submit function:", error.message);
      }
    }
  };

  return (
    <>
      <header>
        <h1>Blissful Bites</h1>
      </header>
      <main>
        <section>
          <div className="control-container">
            <Input
              type="search"
              placeholder="Filter by any field"
              aria-label="Filter by any field"
              onChange={search}
            />
            <div className="sort-container">
              {!!food.length && (
                <Dropdown options={["id", "type", "topping"]} sort={sort} />
              )}
              <Button onClick={flipOrder}>
                <span className="sr-only">order by </span>
                {sortOrder.toUpperCase()}
              </Button>
            </div>
          </div>
          <>
            <header className="table-container">
              <h3 id="table-heading">Bites</h3>
            </header>
            <div className="data-container">
              <Table data={filteredFood} />
            </div>
          </>
        </section>
        <section>
          <div className="form-container">
            <header>
              <h3 id="form-heading">Add your own bite</h3>
            </header>
            <FoodForm onSubmit={submit} />
          </div>
        </section>
      </main>
      <ToastContainer />
    </>
  );
};

export default App;
