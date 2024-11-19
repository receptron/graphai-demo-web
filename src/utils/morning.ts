const sleep = async (milliseconds: number) => {
  return await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const just_task = async (name: string, time: number) => {
  console.log(`start task ${name}`);
  await sleep(time * 1000);
  console.log(`end task ${name}`);
};

const cycle_task = async (name: string, time: number, count: number) => {
  let task_counter = 0;
  console.log(`start task ${name}`);
  while (task_counter < count) {
    //console.log({task_counter, count})
    console.log(`task ${name} call`);
    task_counter = task_counter + 1;
    if (task_counter < count) {
      await sleep(time * 1000);
    }
  }
  console.log(`end task ${name}`);
};

const task_1_coffee_water = async () => {
  await just_task("1 coffee water", 4);
};

const task_2_wakeup = async () => {
  await cycle_task("2", 3, 5);
};

const task_3_cooking = async () => {
  await just_task("3 cooking", 15);
};

const task_4_newspaper = async () => {
  await cycle_task("4 newspaper", 5, 4);
};

const task_5_drip_coffee = async () => {
  await just_task("5 coffee drip", 5);
};

const task_6_changing_childrens_clothes = async () => {
  await just_task("6 change", 6);
};
const task_7_do_laundry = async () => {
  await just_task("7 wash", 13);
};

const task_8_breakfirst = async () => {
  await just_task("8 breakfirst", 9);
};

const task_9_dry_the_laundry = async () => {
  await just_task("9 laundry", 5);
};

const task_10_coffee = async () => {
  await just_task("10 drink coffee", 5);
};

const task_11_wash_dish = async () => {
  await just_task("11 wash dish", 4);
};

const task_12_ready_to_go_out = async () => {
  await just_task("12 ready to go out", 3);
};

const task_13_read_news_paper = async () => {
  await just_task("13 read news paper", 8);
};

const task_14_go_out = () => {
  console.log("14 go out");
};

export const graph_data_morning = {
  version: 0.5,
  nodes: {
    task_1_coffee_water: {
      agent: task_1_coffee_water,
    },
    task_2_wakeup: {
      agent: task_2_wakeup,
    },
    task_3_cooking: {
      agent: task_3_cooking,
    },
    task_4_newspaper: {
      agent: task_4_newspaper,
    },
    task_5_drip_coffee: {
      agent: task_5_drip_coffee,
      inputs: { array: [":task_1_coffee_water"] },
    },
    task_6_changing_childrens_clothes: {
      agent: task_6_changing_childrens_clothes,
      inputs: { array: [":task_2_wakeup"] },
    },
    task_7_do_laundry: {
      agent: task_7_do_laundry,
      inputs: { array: [":task_6_changing_childrens_clothes"] },
    },
    task_8_breakfirst: {
      agent: task_8_breakfirst,
      inputs: { array: [":task_3_cooking", ":task_5_drip_coffee", ":task_6_changing_childrens_clothes"] },
    },
    task_9_dry_the_laundry: {
      agent: task_9_dry_the_laundry,
      inputs: { array: [":task_7_do_laundry"] },
    },
    task_10_coffee: {
      agent: task_10_coffee,
      inputs: { array: [":task_5_drip_coffee", ":task_9_dry_the_laundry"] },
    },
    task_11_wash_dish: {
      agent: task_11_wash_dish,
      inputs: { array: [":task_8_breakfirst", ":task_10_coffee"] },
    },
    task_12_ready_to_go_out: {
      agent: task_12_ready_to_go_out,
      inputs: { array: [":task_8_breakfirst"] },
    },
    task_13_read_news_paper: {
      agent: task_13_read_news_paper,
      inputs: { array: [":task_4_newspaper"] },
    },
    task14: {
      agent: task_14_go_out,
      inputs: {
        array: [
          ":task_1_coffee_water",
          ":task_2_wakeup",
          ":task_3_cooking",
          ":task_4_newspaper",
          ":task_5_drip_coffee",
          ":task_6_changing_childrens_clothes",
          ":task_7_do_laundry",
          ":task_8_breakfirst",
          ":task_9_dry_the_laundry",
          ":task_10_coffee",
          ":task_11_wash_dish",
          ":task_12_ready_to_go_out",
          ":task_13_read_news_paper",
        ],
      },
    },
  },
};
