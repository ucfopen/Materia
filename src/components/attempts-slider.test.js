import React from 'react';
import { render, screen } from '@testing-library/react'
import AttemptsSlider from './attempts-slider.jsx';
//import { shallow } from 'enzyme';
//import toJson from "enzyme-to-json";

const getState = (sliderVal = 1, guestMode = "notguest", lastActive = 0) => ({
	formData: {
		changes: {
			access: guestMode
		}
	},
	sliderVal: sliderVal,
	lastActive: lastActive,
})

const mockSetState = jest.fn()

describe('AttemptsSlider', () => {
	test.todo('test title')
})

/*
describe('AttemptsSlider', () => {
	test('test title', () => {
		//const component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState()} setState={mockSetState} />);
		expect(1).toBe(1)
	})
})


const getState = (sliderVal = 1, guestMode = "notguest", lastActive = 0) => ({
	formData: {
		changes: {
			access: guestMode
		}
	},
	sliderVal: sliderVal,
	lastActive: lastActive,
})

const mockSetState = jest.fn()
const mockSliderNum = jest.fn()
const makeEvent = (val = '1') => ({
	target: { value: val },
	stopPropagation: jest.fn(),
	preventDefault: jest.fn()
})

describe('AttemptsSlider', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should render', () => {
		const component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState()} setState={mockSetState} />);
		expect(toJson(component)).toMatchSnapshot();
	});

	test('clicking number should update component', () => {
		const component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState()} setState={mockSetState} />);
		expect(component.find('.active').length).toBe(1);
		expect(component.find('.active').text()).toBe("1");

		expect(mockSetState.mock.calls.length).toBe(0);
		component.find('#attempt-holder').childAt(1).prop('onClick')();
		expect(mockSetState.mock.calls.length).toBe(1);

		// Click calls proper update
		expect(mockSetState.mock.calls[0][0].sliderVal).toBe('5');
	});

	test('label should not display without guest mode active', () => {
		let component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState()} setState={mockSetState} />);
		expect(component.find('.desc-notice').length).toBe(0);

		component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState(1, "guest")} setState={mockSetState} />);
		expect(component.find('.desc-notice').length).toBe(1);
	});

	it('should be disabled when in guest mode', () => {
		const component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState()} setState={mockSetState} />);
		expect(component.find('.disabled').length).toBe(0);

		component.setProps({ state: getState(1, "guest") })

		// Components should be disabled via class
		expect(component.find('.disabled').length).toBe(3);

		// Clicking shouldn't change state
		expect(mockSetState.mock.calls.length).toBe(0);
		component.find('#attempt-holder').childAt(1).prop('onClick')();
		expect(mockSetState.mock.calls.length).toBe(0);

		// OnChange shouldn't change state
		component.find('#ui-slider').simulate('change', makeEvent("50"))
		expect(mockSetState.mock.calls.length).toBe(0);
	});

	test('current value should change when props change', () => {
		const component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState()} setState={mockSetState} />);
		expect(component.find('.active').length).toBe(1);
		expect(component.find('.active').text()).toBe("1");

		// Changing slider value
		component.setProps({ state: getState(59, "notguest", 6) })
		expect(component.find('.active').length).toBe(1);
		expect(component.find('.active').text()).toBe("15");
	});

	test('on mouse up should change state values', () => {
		const component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState()} setState={mockSetState} />);

		// Clicking should change state
		expect(mockSetState.mock.calls.length).toBe(0);
		component.find('#ui-slider').simulate('mouseUp', makeEvent("50"))
		expect(mockSetState.mock.calls.length).toBe(1);
		expect(mockSetState.mock.calls[0][0].sliderVal).toBe("59");
		expect(mockSetState.mock.calls[0][0].lastActive).toBe(6);
	});

	test('on blur should change state values', () => {
		const component = shallow(<AttemptsSlider inst={{ is_embedded: false }} state={getState()} setState={mockSetState} />);

		// Clicking should change state
		expect(mockSetState.mock.calls.length).toBe(0);
		component.find('#ui-slider').simulate('blur', makeEvent("50"))
		expect(mockSetState.mock.calls.length).toBe(1);
		expect(mockSetState.mock.calls[0][0].sliderVal).toBe("59");
		expect(mockSetState.mock.calls[0][0].lastActive).toBe(6);
	});

});
*/
