import React from 'react';


import SHEET_DATA from 'assets/sheet_data.json';

import OptionCheckbox from 'components/combined/OptionCheckbox';
import OptionComment from 'components/combined/OptionComment';
import OptionFloat from 'components/combined/OptionFloat';
import OptionNumeric from 'components/combined/OptionNumeric';
import OptionText from 'components/combined/OptionText';
import OptionMultiSelect from 'components/combined/OptionMultiSelect';

import { ChangeTab, ChangeMultipleOptions } from './actions';

import {
    Labels,
    OptionTypes,
    OptionInterface,
    RootState,
    RequiresType,
    ConflictType,
    VariableType,
    VariableInterface,
    ActionType,
    ValueType,
} from './types';


const get_requ_string = (requires: RequiresType): (string | string[])[] => {
    return requires.map(require => {
        if (typeof require === "number") {
            if (require < 0) {
                return ALL_VARIABLES[-(require + 1)].name;
            } else {
                return ALL_OPTIONS[require].name;
            }
        } else if (typeof require === "object") {
            return get_requ_string(require) as string[];
        } else {
            console.error("requires elem is neither string nor number nor object");
        }
        return "UNDEFINED";
    });
}

const get_conf_string = (conflict: ConflictType) => {
    return conflict.map(conf => {
        if (typeof conf === "number") {
            if (conf < 0) {
                return ALL_VARIABLES[-(conf + 1)].name;
            } else {
                return ALL_OPTIONS[conf].name;
            }
        } else {
            console.error("Type of conflict element is not string or number");
        }
        return "UNDEFINED";
    })
}

interface Option extends OptionInterface {}
class Option {
    constructor(data: any) {
        this.name = data[Labels.NAME] || "NO NAME";
        this.credits = data[Labels.CREDITS] || 0;
        this.details = data[Labels.DETAILS] || "";

        if (data[Labels.REQUIRES])
            this.requires = data[Labels.REQUIRES];
        if (data[Labels.CONFLICT])
            this.conflict = data[Labels.CONFLICT];

        if (data[Labels.AFFECT])
            this.affect = data[Labels.AFFECT];

        if (data[Labels.ROOMMATES])
            this.roommates = data[Labels.ROOMMATES];
        if (data[Labels.SALARY])
            this.salary = data[Labels.SALARY];

        if (data[Labels.TYPE])
            this.type = data[Labels.TYPE];
        if (data[Labels.IS_PARENT])
            this.is_parent = data[Labels.IS_PARENT];
        if (data[Labels.OTHER_REQU])
            this.other_requ = data[Labels.OTHER_REQU];
        if (data[Labels.OTHER_CONF])
            this.other_conf = data[Labels.OTHER_CONF];
        if (data[Labels.OTHER_EV])
            this.other_ev = data[Labels.OTHER_EV];

        if (data[Labels.VARIABLE])
            this.variables = data[Labels.VARIABLE];
    }
}

const OPTION_DATA = SHEET_DATA['option_data'];
let ALL_OPTIONS: OptionInterface[] = [];
let LAYOUT_DATA: ((string | number)[])[] = SHEET_DATA['layout_data'];
const VARIABLE_DATA: VariableType = SHEET_DATA['variables'] as VariableType;
const COL_NAMES = SHEET_DATA['col_names'];
let ALL_VARIABLES: VariableInterface[] = [];
let OPTION_REFS: React.RefObject<HTMLDivElement>[] = [];

const Initialize = () => {
    ALL_OPTIONS = OPTION_DATA.map(el => new Option(el));
    ALL_VARIABLES = VARIABLE_DATA.map(el => ({
        name: el[0], requ: el[1], conf: el[2], affe: el[3], ev: el[4],
    }));
    ALL_OPTIONS.forEach(el => {
        let requires = el.requires;
        if (requires) {
            el.requires_string = get_requ_string(requires);
        }
        let conflict = el.conflict;
        if (conflict) {
            el.conflict_string = get_conf_string(conflict);
        }
    })
    console.log(LAYOUT_DATA);
    console.log(ALL_OPTIONS);
    console.log(ALL_VARIABLES);
    console.log(COL_NAMES);
};

const PostInit = (store: {dispatch: (action: ActionType) => void}) => {
    let cm_updates: [number, ValueType][] = [];
    ALL_OPTIONS.forEach((el, idx) => {
        if (el.type[0] === OptionTypes.CM) {
            cm_updates.push([idx, true]);
        }
    });
    store.dispatch(ChangeMultipleOptions(cm_updates));
};

const constructOption = (idx: number) => {
    OPTION_REFS[idx] = React.createRef();
    switch (ALL_OPTIONS[idx].type[0]) {
        case OptionTypes.BO:
            return <OptionCheckbox div_ref={OPTION_REFS[idx]} option_idx={idx} key={idx}/>;
        case OptionTypes.CM:
            return <OptionComment div_ref={OPTION_REFS[idx]} option_idx={idx} key={idx}/>;
        case OptionTypes.FL:
            return <OptionFloat div_ref={OPTION_REFS[idx]} option_idx={idx} key={idx}/>;
        case OptionTypes.NU:
            return <OptionNumeric div_ref={OPTION_REFS[idx]} option_idx={idx} key={idx}/>;
        case OptionTypes.TE:
            return <OptionText div_ref={OPTION_REFS[idx]} option_idx={idx} key={idx}/>;
        case OptionTypes.EV:
        case OptionTypes.EV_EX:
        case OptionTypes.EV_CRE:
            return <OptionMultiSelect div_ref={OPTION_REFS[idx]} option_idx={idx} key={idx}/>;
        case OptionTypes.OW:  // TODO: have actual custom option
        case OptionTypes.PU:  // TODO: have actual custom option
            return <OptionCheckbox div_ref={OPTION_REFS[idx]} option_idx={idx} key={idx}/>;
    }
}

const get_requ_checked = (option_idx: number, state: RootState, requ_obj?: number[]): (boolean | boolean[])[] => {
    const option = ALL_OPTIONS[option_idx];
    let requires = requ_obj || option.requires || [];
    return requires.map(require => {
        if (typeof require === "number") {
            if (require < 0) {
                return !!state.variables[-(require + 1)].value;
            } else {
                return !!state.option[require].value;
            }
        } else if (typeof require === "object") {
            return get_requ_checked(option_idx, state, require) as boolean[];
        } else {
            console.error("Type of requires element is not string or number or object");
        }
        return false;
    });
}

const get_conf_checked = (option_idx: number, state: RootState) => {
    const option = ALL_OPTIONS[option_idx];
    let conflict = option.conflict || [];
    return conflict.map(conf => {
        if (typeof conf === "number") {
            if (state.option[option_idx].valid) {
                return false;
            } else if (conf < 0) {
                return !!state.variables[-(conf + 1)].value;
            } else {
                return !!state.option[conf].value;
            }
        } else {
            console.error("Type of conflict element is not string or number");
        }
        return false;
    });
}

const filter_excl = (res: number[], filter: number, ev_list: number[], state: RootState) => {
    let filtered = false;
    if (ALL_OPTIONS[filter].type[0] !== OptionTypes.EV_EX) {
        return {res, filtered};
    }
    ev_list.forEach(el => {
        if (el === filter || ALL_OPTIONS[el].type[0] !== OptionTypes.EV_EX) {
            return;
        }
        let val = state.option[el].value;
        if (typeof val === 'object') {
            val.forEach(num => {
                let idx = res.indexOf(num);
                if (idx > -1) {
                    filtered = true;
                    res.splice(idx, 1);
                }
            });
        }
    })
    return {res, filtered};
};

const get_nu_vals = (option_idx: number, filter: number, state: RootState) => {
    let res = Array.from(Array(+state.option[option_idx].value).keys());
    return filter_excl(res, filter, ALL_OPTIONS[option_idx].other_ev, state);
};

const get_ev_vals = (option_idx: number, filter: number, state: RootState) => {
    let res = Array.from(state.option[option_idx].value as number[]);
    return filter_excl(res, filter, ALL_OPTIONS[option_idx].other_ev, state);
};

const get_var_vals = (var_idx: number, filter: number, state: RootState) => {
    let res = Array.from(state.variables[-(var_idx + 1)].options);
    return filter_excl(res, filter, ALL_VARIABLES[-(var_idx + 1)].ev, state);
};

const get_name_strings = (option_idx: number, state: RootState) => {
    let name_strings: [string, number][] = [];
    let name_strings_map: {[index: number]: number} = {};
    let origin_name = '';
    let idx = 0;
    let other_idx = ALL_OPTIONS[option_idx].type[1] as number;
    let res: number[];
    let filtered = false;
    if (other_idx >= 0) {
        let other_option: Option = ALL_OPTIONS[other_idx];
        origin_name = other_option.name;
        if (other_option.type[0] === OptionTypes.NU) {
            ({res, filtered} = get_nu_vals(other_idx, option_idx, state));
            res.forEach(el => {
                name_strings.push([`#${el + 1} ${origin_name}`, el]);
                name_strings_map[el] = idx++;
            });
        } else if ([OptionTypes.EV, OptionTypes.EV_EX, OptionTypes.EV_CRE].includes(other_option.type[0])) {
            ({res, filtered} = get_ev_vals(other_idx, option_idx, state));
            let parent_numeric = "";
            while (typeof other_option.type[1] === 'number' && other_option.type[1] >= 0) {
                other_option = ALL_OPTIONS[other_option.type[1]];
                if (other_option.type[0] === OptionTypes.NU) {
                    parent_numeric = other_option.name;
                    break;
                }
            }
            res.forEach(el => {
                let str = parent_numeric === '' ? ALL_OPTIONS[el].name : `#${el + 1} ${parent_numeric}`;
                name_strings.push([str, el]);
                name_strings_map[el] = idx++;
            })
        }
    } else {
        ({res, filtered} = get_var_vals(other_idx, option_idx, state));
        origin_name = ALL_VARIABLES[-(other_idx + 1)].name;
        res.forEach(el => {
            name_strings.push([ALL_OPTIONS[el].name, el]);
            name_strings_map[el] = idx++;
        });
    }
    return { name_strings, name_strings_map, origin_name, filtered };
};

const calc_affected = (credits: number, affected: [number, number][]) => {
    affected.forEach(el => {
        switch(el[0]) {
            case 0:
                credits += el[1];
                break;
            case 1:
                credits -= el[1];
                break;
            case 2:
                credits *= el[1];
                break;
            case 3:
                credits /= el[1];
                break;
            case 4:
                credits = el[1];
                break;
        }
    });
    return credits;
}

const get_hash = (val: string) => {
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
        hash = (hash << 5) - hash + val.charCodeAt(i);
    }
    return hash;
}

const get_save_state = (state: RootState) => {
    let res: [number, number, ValueType][] = [];
    state.option.forEach((el, idx) => {
        const option = ALL_OPTIONS[idx];
        if (el.value && option.type[0] !== OptionTypes.CM) {
            const name_hash = get_hash(option.name);
            const desc_hash = get_hash(option.details);
            const value = el.value;
            res.push([name_hash, desc_hash, value]);
        }
    });
    return res;
}

const load_save_state = (
    load_state: [number, number, ValueType][]
) => {
    let name_map: {[index: number]: number} = {};
    let desc_map: {[index: number]: number} = {};
    ALL_OPTIONS.forEach((el, idx) => {
        name_map[get_hash(el.name)] = idx;
        desc_map[get_hash(el.details)] = idx;
    });
    return load_state.map(el => {
        let option_idx = name_map[el[0]];
        if (option_idx === undefined) {
            option_idx = desc_map[el[1]];
            if (option_idx === undefined) {
                return undefined;
            }
        }
        return [option_idx, el[2]];
    }).filter(el => el !== undefined) as [number, ValueType][];
}

const get_page = (option_idx: number) => {
    for (let i = 0; i < LAYOUT_DATA.length; i++) {
        let start = 0, end = LAYOUT_DATA[i].length - 1;
        while (typeof LAYOUT_DATA[i][start] !== 'number') {
            start++;
        }
        while (typeof LAYOUT_DATA[i][end] !== 'number') {
            end--;
        }
        if (option_idx >= LAYOUT_DATA[i][start] && option_idx <= LAYOUT_DATA[i][end]) {
            return i;
        }
    }
    return -1;
}

const scroll_to_option = (store: {dispatch: (action: ActionType) => void, getState: () => RootState}, option_idx: number) => {
    const page_idx = get_page(option_idx);
    if (store.getState().page_id !== page_idx) {
        store.dispatch(ChangeTab(page_idx));
        setTimeout(() => {
            OPTION_REFS[option_idx].current?.scrollIntoView({block: "center"});
        }, 0);
    } else {
        OPTION_REFS[option_idx].current?.scrollIntoView({block: "center", behavior: "smooth"});
    }
}

export { Initialize, PostInit, ALL_OPTIONS, LAYOUT_DATA, COL_NAMES, ALL_VARIABLES, OPTION_REFS, Option,
    constructOption, get_requ_checked, get_conf_checked, get_name_strings, calc_affected,
    get_save_state, load_save_state, scroll_to_option };